import { useState } from "react";
// import { Link } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
// import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store";
import { useNavigate } from "react-router";
import { login } from "../../store/authSlice";
// Validate Schema SignIn
const SignInSchema = Yup.object().shape({
  username: Yup.string().required("Tên đăng nhập là bắt buộc"),
  password: Yup.string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .required("Mật khẩu là bắt buộc"),
});

// Type in form values
export interface SignInValues {
  username: string;
  password: string;
  grant_type?: string;
  scope?: string;
  client_id?: string;
  client_secret?: string;
}

export default function SignInForm() {
  // Show password
  const [showPassword, setShowPassword] = useState(false);
  // Click button save password
  // const [isChecked, setIsChecked] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleSubmit = async (values: SignInValues) => {
    try {
      setApiError(null);
      const result = await dispatch(login(values)).unwrap();
      if (result.token) {
        navigate("/");
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setApiError(err);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Đăng nhập
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nhập tên đăng nhập và mật khẩu để đăng nhập
            </p>
          </div>
          {apiError && (
            <div className="mb-4 text-sm text-red-500 ">Lỗi: {apiError}</div>
          )}

          <Formik
            initialValues={{
              username: "",
              password: "",
            }}
            validationSchema={SignInSchema}
            onSubmit={handleSubmit}>
            {({ isSubmitting }) => (
              <Form>
                <div className="space-y-6">
                  {/* Email */}
                  <div>
                    <Label>
                      Tên đăng nhập <span className="text-error-500">*</span>
                    </Label>
                    <Field
                      name="username"
                      type="text"
                      placeholder="Enter your username..."
                      as={Input}
                    />
                    <ErrorMessage
                      name="username"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <Label>
                      Mật khẩu <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Field
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password..."
                        as={Input}
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2">
                        {showPassword ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        )}
                      </span>
                    </div>
                    <ErrorMessage
                      name="password"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  {/* Remember me & Forgot Password */}
                  {/* <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isChecked}
                        onChange={() => setIsChecked(!isChecked)}
                      />
                      <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                        Ghi nhớ mật khẩu
                      </span>
                    </div>
                    <Link
                      to="/reset-password"
                      className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400">
                      Quên mật khẩu?
                    </Link>
                  </div> */}

                  {/* Submit Button */}
                  <div>
                    <Button
                      type="submit"
                      className="w-full"
                      size="sm"
                      disabled={isSubmitting}>
                      {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
                    </Button>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
          {/* Navigate to SignUpForm */}
          {/* <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Không có tài khoản?{" "}
              <Link
                to="/signup"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                Đăng ký
              </Link>
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
}
