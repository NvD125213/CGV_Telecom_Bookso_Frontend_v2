import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Đăng nhập | Hệ thống đặt số của CGV Telecom"
        description="Đăng nhập với username và password để sử dụng hệ thống Book số của CGV Telecom"
      />
      <AuthLayout>  
        <SignInForm />
      </AuthLayout>
    </>
  );
}
