import React, { memo } from 'react';
import { getComponent } from '@lowcode/components';
import type { PageComponent } from '@lowcode/types';

interface DynamicComponentProps {
  component: PageComponent;
}

export const DynamicComponent: React.FC<DynamicComponentProps> = memo(({ component }) => {
  const Component = getComponent(component.type);

  if (!Component) {
    return (
      <div style={{ padding: 16, color: '#999', background: '#f5f5f5', borderRadius: 4 }}>
        未知组件: {component.type}
      </div>
    );
  }

  return <Component {...component.props} />;
});
