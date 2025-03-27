import { Navigate, Outlet } from "react-router";
import { useSelector } from "react-redux";
import { RootState } from "../store";

interface PublicRouteProps {
  redirectPath?: string;
}

export const PublicRoute = ({ redirectPath = "/" }: PublicRouteProps) => {
  const { token } = useSelector((state: RootState) => state.auth);

  if (token) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};
