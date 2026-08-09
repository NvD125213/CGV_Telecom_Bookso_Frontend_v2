import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import TwoFactorForm from "../../components/auth/TwoFactorForm";

export default function TwoFactorVerify() {
  return (
    <>
      <PageMeta
        title="Xác thực hai lớp | Hệ thống đặt số của CGV Telecom"
        description="Xác thực bằng passkey hoặc mã khôi phục để hoàn tất đăng nhập"
      />
      <AuthLayout>
        <TwoFactorForm />
      </AuthLayout>
    </>
  );
}
