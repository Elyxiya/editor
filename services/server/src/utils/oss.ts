/**
 * OSS 存储配置模块
 * 支持阿里云 OSS、AWS S3 和本地存储三种模式
 */

import path from 'path';
import fs from 'fs';

export type StorageProvider = 'aliyun' | 'aws' | 'local';

export interface StorageConfig {
  provider: StorageProvider;
  region: string;
  bucket: string;
  accessKeyId?: string;
  accessKeySecret?: string;
  endpoint?: string;
}

export interface UploadResult {
  url: string;
  path: string;
  provider: StorageProvider;
}

// 动态导入类型
type OSSClient = any;
type S3Client = any;

/**
 * 获取存储配置
 */
export function getStorageConfig(): StorageConfig {
  const provider = (process.env.OSS_PROVIDER as StorageProvider) || 'local';

  const config: StorageConfig = {
    provider,
    region: process.env.OSS_REGION || process.env.AWS_REGION || 'cn-hangzhou',
    bucket: process.env.OSS_BUCKET || process.env.AWS_S3_BUCKET || 'lowcode-deploy',
  };

  if (provider === 'aliyun') {
    config.accessKeyId = process.env.OSS_ACCESS_KEY_ID;
    config.accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;
    config.endpoint = process.env.OSS_ENDPOINT;
  } else if (provider === 'aws') {
    config.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    config.accessKeySecret = process.env.AWS_SECRET_ACCESS_KEY;
  }

  return config;
}

/**
 * OSS 客户端工厂（延迟初始化）
 */
let aliyunOSSClient: OSSClient | null = null;
let awsS3Client: S3Client | null = null;

async function getAliyunOSSClient(): Promise<OSSClient> {
  if (aliyunOSSClient) {
    return aliyunOSSClient;
  }

  const config = getStorageConfig();
  const OSS = (await import('ali-oss')).default;
  
  const options: any = {
    region: config.region,
    accessKeyId: config.accessKeyId!,
    accessKeySecret: config.accessKeySecret!,
  };

  if (config.endpoint) {
    options.endpoint = config.endpoint;
  }

  aliyunOSSClient = new OSS(options);
  return aliyunOSSClient;
}

async function getAwsS3Client(): Promise<S3Client> {
  if (awsS3Client) {
    return awsS3Client;
  }

  const config = getStorageConfig();
  const AWS = (await import('aws-sdk')).default;
  
  awsS3Client = new AWS.S3({
    region: config.region,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.accessKeySecret,
  });
  return awsS3Client;
}

/**
 * 上传文件到指定存储
 */
export async function uploadFile(
  filePath: string,
  remotePath: string
): Promise<UploadResult> {
  const config = getStorageConfig();

  switch (config.provider) {
    case 'aliyun':
      return uploadToAliyun(filePath, remotePath, config);
    case 'aws':
      return uploadToAwsS3(filePath, remotePath, config);
    case 'local':
    default:
      return uploadToLocal(filePath, remotePath, config);
  }
}

/**
 * 上传到阿里云 OSS
 */
async function uploadToAliyun(
  filePath: string,
  remotePath: string,
  config: StorageConfig
): Promise<UploadResult> {
  const client = await getAliyunOSSClient();
  const normalizedPath = remotePath.replace(/\\/g, '/');

  try {
    const result = await client.put(normalizedPath, filePath);
    
    const url = result.url || `https://${config.bucket}.${config.region}.aliyuncs.com/${normalizedPath}`;

    return {
      url,
      path: normalizedPath,
      provider: 'aliyun',
    };
  } catch (error: any) {
    throw new Error(`阿里云 OSS 上传失败: ${error.message}`);
  }
}

/**
 * 上传到 AWS S3
 */
async function uploadToAwsS3(
  filePath: string,
  remotePath: string,
  config: StorageConfig
): Promise<UploadResult> {
  const client = await getAwsS3Client();
  const normalizedPath = remotePath.replace(/\\/g, '/');
  const fileContent = fs.readFileSync(filePath);

  try {
    const result = await client
      .upload({
        Bucket: config.bucket,
        Key: normalizedPath,
        Body: fileContent,
        ACL: 'public-read',
      })
      .promise();

    return {
      url: result.Location,
      path: normalizedPath,
      provider: 'aws',
    };
  } catch (error: any) {
    throw new Error(`AWS S3 上传失败: ${error.message}`);
  }
}

/**
 * 上传到本地目录（回退模式）
 */
async function uploadToLocal(
  filePath: string,
  remotePath: string,
  config: StorageConfig
): Promise<UploadResult> {
  const deployDir = process.env.DEPLOY_DIR || path.join(process.cwd(), 'deploy');
  const localPath = path.join(deployDir, remotePath.replace(/\\/g, '/'));
  const localDir = path.dirname(localPath);

  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }

  fs.copyFileSync(filePath, localPath);

  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
  const url = `${baseUrl}/deploy/${remotePath.replace(/\\/g, '/')}`;

  return {
    url,
    path: localPath,
    provider: 'local',
  };
}

/**
 * 删除远程文件
 */
export async function deleteFile(remotePath: string): Promise<void> {
  const config = getStorageConfig();
  const normalizedPath = remotePath.replace(/\\/g, '/');

  switch (config.provider) {
    case 'aliyun': {
      const client = await getAliyunOSSClient();
      await client.delete(normalizedPath);
      break;
    }
    case 'aws': {
      const client = await getAwsS3Client();
      await client.deleteObject({ Bucket: config.bucket, Key: normalizedPath }).promise();
      break;
    }
    case 'local':
    default: {
      const deployDir = process.env.DEPLOY_DIR || path.join(process.cwd(), 'deploy');
      const localPath = path.join(deployDir, normalizedPath);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
      break;
    }
  }
}

/**
 * 检查存储配置是否有效
 */
export function isStorageConfigured(): boolean {
  const config = getStorageConfig();

  if (config.provider === 'local') {
    return true;
  }

  if (config.provider === 'aliyun') {
    return !!(config.accessKeyId && config.accessKeySecret && config.bucket);
  }

  if (config.provider === 'aws') {
    return !!(config.accessKeyId && config.accessKeySecret && config.bucket);
  }

  return false;
}

/**
 * 获取存储提供商名称（用于显示）
 */
export function getStorageProviderName(): string {
  const config = getStorageConfig();

  switch (config.provider) {
    case 'aliyun':
      return '阿里云 OSS';
    case 'aws':
      return 'AWS S3';
    case 'local':
    default:
      return '本地存储';
  }
}
