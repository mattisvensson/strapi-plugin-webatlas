import React from 'react';
import { useModalSharedLogic } from './useModalSharedLogic';

export function withModalSharedLogic<T>(Component: React.FunctionComponent<T & ReturnType<typeof useModalSharedLogic>>): React.FC<T> {
  return function WrappedComponent(props: T) {
    const sharedLogic = useModalSharedLogic();
    return <Component {...props} {...sharedLogic} />;
  };
}