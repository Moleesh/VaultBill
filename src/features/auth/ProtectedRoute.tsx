import { Navigate, useLocation } from 'react-router-dom';
import type { FC, PropsWithChildren } from 'react';

import { useSession } from './SessionContext';
import type { Role } from '../../types/AppTypes';

type ProtectedRouteProps = PropsWithChildren<{
  readonly roles?: readonly Role[];
}>;

export const ProtectedRoute: FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { operatorContext } = useSession();
  const location = useLocation();

  if (!operatorContext) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  if (roles && !roles.includes(operatorContext.role)) {
    return (
      <Navigate
        replace
        to={operatorContext.role === 'SysAdmin' ? '/app/dashboard' : '/app/records'}
      />
    );
  }

  return children;
};
