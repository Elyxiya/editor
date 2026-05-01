import { useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useEditorStore } from '@/store/editorStore';

export function useKeyboardShortcuts() {
  const {
    selectedId,
    clipboard,
    undo,
    redo,
    savePage,
    duplicateComponent,
    removeComponent,
    pasteComponent,
    copyComponent,
    cutComponent,
    bringToTop,
    sendToBottom,
    moveUp,
    moveDown,
    isDirty,
  } = useEditorStore() as any;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isMetaOrCtrl = e.metaKey || e.ctrlKey;

    if (isMetaOrCtrl && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }

    if (isMetaOrCtrl && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      redo();
    }

    if (isMetaOrCtrl && e.key === 'y') {
      e.preventDefault();
      redo();
    }

    if (isMetaOrCtrl && e.key === 's') {
      e.preventDefault();
      if (isDirty) {
        savePage()
          .then(() => message.success('保存成功'))
          .catch(() => message.error('保存失败'));
      }
    }

    if (isMetaOrCtrl && e.key === 'c') {
      if (selectedId && !window.getSelection()?.toString()) {
        e.preventDefault();
        copyComponent(selectedId);
        message.success('已复制');
      }
    }

    if (isMetaOrCtrl && e.key === 'x') {
      if (selectedId && !window.getSelection()?.toString()) {
        e.preventDefault();
        cutComponent(selectedId);
        message.success('已剪切');
      }
    }

    if (isMetaOrCtrl && e.key === 'v') {
      if (clipboard && !window.getSelection()?.toString()) {
        e.preventDefault();
        pasteComponent();
        message.success('已粘贴');
      }
    }

    if (isMetaOrCtrl && e.key === 'd') {
      if (selectedId && !window.getSelection()?.toString()) {
        e.preventDefault();
        duplicateComponent(selectedId);
      }
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedId && !window.getSelection()?.toString()) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          e.preventDefault();
          removeComponent(selectedId);
        }
      }
    }

    if (e.key === 'Escape') {
      useEditorStore.setState({ selectedId: null });
    }

    // Layer management shortcuts
    if (e.key === ']' && !isMetaOrCtrl && !e.shiftKey && !e.altKey) {
      if (selectedId && !window.getSelection()?.toString()) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          e.preventDefault();
          moveDown();
        }
      }
    }

    if (e.key === '[' && !isMetaOrCtrl && !e.shiftKey && !e.altKey) {
      if (selectedId && !window.getSelection()?.toString()) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          e.preventDefault();
          moveUp();
        }
      }
    }
  }, [
    selectedId,
    clipboard,
    undo,
    redo,
    savePage,
    duplicateComponent,
    removeComponent,
    pasteComponent,
    copyComponent,
    cutComponent,
    bringToTop,
    sendToBottom,
    moveUp,
    moveDown,
    isDirty,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
