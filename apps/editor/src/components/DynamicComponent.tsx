import React, { memo } from 'react';
import { getComponent } from '@lowcode/components';
import type { PageComponent } from '@lowcode/types';

interface DynamicComponentProps {
  component: PageComponent;
}

interface DynamicComponentListProps {
  components: PageComponent[];
}

const DynamicComponentList: React.FC<DynamicComponentListProps> = memo(({ components }) => (
  <>
    {components.map((child) => (
      <DynamicComponent key={child.id} component={child} />
    ))}
  </>
));

export const DynamicComponent: React.FC<DynamicComponentProps> = memo(({ component }) => {
  const Component = getComponent(component.type);

  if (!Component) {
    return (
      <div style={{ padding: 16, color: '#999', background: '#f5f5f5', borderRadius: 4 }}>
        未知组件: {component.type}
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { children: _childrenFromProps, ...restProps } = component.props || {};

  return (
    <Component {...restProps}>
      {component.children && (
        <DynamicComponentList components={component.children} />
      )}
    </Component>
  );
});
