import { Navigate, Outlet } from "react-router";
import { useSelector } from "react-redux";
import { RootState } from "../store";

interface PrivateRouteProps {
  requiredRole?: string;
  redirectPath?: string;
}

export const PrivateRoute = ({
  requiredRole,
  redirectPath = "/signin",
}: PrivateRouteProps) => {
  const { token, user } = useSelector((state: RootState) => state.auth);

  if (!token) {
    return <Navigate to={redirectPath} replace />;
  }

  if (requiredRole && String(user.role) !== String(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
