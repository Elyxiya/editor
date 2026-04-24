import React from 'react';
import { getComponent } from '@lowcode/components';
import type { PageSchema, PageComponent } from '@lowcode/types';

interface PageRendererProps {
  schema: PageSchema;
}

const RenderComponent: React.FC<{ component: PageComponent }> = ({ component }) => {
  const Component = getComponent(component.type);

  if (!Component) {
    return (
      <div style={{ padding: 16, background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 4 }}>
        未知组件: {component.type}
      </div>
    );
  }

  return <Component {...component.props} />;
};

const RenderContainer: React.FC<{ component: PageComponent }> = ({ component }) => {
  const { children, ...props } = component;

  if (component.type === 'Container') {
    return (
      <div
        style={{
          display: 'flex',
          padding: props.padding || 16,
          background: props.backgroundColor || '#ffffff',
          borderRadius: props.borderRadius || 0,
          minHeight: props.minHeight || 'auto',
          flexDirection: props.flexDirection || 'row',
          justifyContent: props.justifyContent || 'flex-start',
          alignItems: props.alignItems || 'flex-start',
          gap: props.gap || 0,
        }}
      >
        {children?.map((child) => (
          <RenderContainer key={child.id} component={child} />
        ))}
      </div>
    );
  }

  if (component.type === 'Space') {
    const gapMap: Record<string, number> = { small: 8, middle: 16, large: 24 };
    const gap = typeof props.size === 'string' ? gapMap[props.size] || 8 : (props.size || 8);
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: props.direction === 'vertical' ? 'column' : 'row',
          gap,
          alignItems: props.align === 'center' ? 'center' : props.align === 'end' ? 'flex-end' : 'flex-start',
        }}
      >
        {children?.map((child) => (
          <RenderContainer key={child.id} component={child} />
        ))}
      </div>
    );
  }

  return (
    <>
      {children?.map((child) => (
        <RenderContainer key={child.id} component={child} />
      ))}
    </>
  );
};

export const PageRenderer: React.FC<PageRendererProps> = ({ schema }) => {
  const { page } = schema;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: page.props.background || '#ffffff',
        padding: page.props.padding || 0,
      }}
    >
      {page.components.map((component) => (
        <RenderContainer key={component.id} component={component} />
      ))}
    </div>
  );
};
