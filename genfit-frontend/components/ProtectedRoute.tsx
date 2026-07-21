import React from 'react';

type ProtectedRouteProps = {
  isAllowed: boolean;
  fallback: React.ReactNode;
  children: React.ReactNode;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ isAllowed, fallback, children }) => {
  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;