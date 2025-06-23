import { forwardRef, useEffect } from "react";
import { IProvider } from "../../types";
import { Modal } from "../ui/modal";
import { useForm } from "react-hook-form";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import TextArea from "../form/input/TextArea";

interface ProviderModalProps {
  isOpen: boolean;
  data?: IProvider;
  onClose: () => void;
  onSubmit: (data: IProvider) => void;
}

// Wrap ProviderModal with forwardRef
const ProviderModal = forwardRef<HTMLDivElement, ProviderModalProps>(
  ({ isOpen, data, onClose, onSubmit }, ref) => {
    const {
      register,
      handleSubmit,
      reset,
      setValue,
      formState: { errors },
    } = useForm<IProvider>();

    useEffect(() => {
      if (data) {
        setValue("name", data.name);
        setValue("description", data.description);
      } else {
        reset();
      }
    }, [data, setValue, reset]);

    const onSubmitHandler = (formData: IProvider) => {
      onSubmit({ ...data, ...formData });
      onClose();
    };

    if (!isOpen) return null;

    return (
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-[700px] m-4">
        <div
          ref={ref} // Pass the ref to the root DOM element
          className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {/* {mode === "create"
                ? "Tạo nhà cung cấp mới"
                : "Cập nhật thông tin nhà cung cấp"} */}
            </h4>
            <p className="hidden sm:block mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Cập nhật thông tin chi tiết để thông tin của bạn luôn được cập
              nhật.
            </p>
          </div>
          <form
            className="flex flex-col"
            onSubmit={handleSubmit(onSubmitHandler)}>
            <div className="px-2 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-1">
                <div>
                  <Label>Tên nhà cung cấp</Label>
                  <Input
                    type="text"
                    {...register("name", {
                      required: "Không được bỏ trống tên !",
                    })}
                  />
                  {errors.name && (
                    <p className="error">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label>Chi tiết</Label>
                  <TextArea
                    {...register("description", {
                      required: "Không được bỏ trống chi tiết !",
                    })}
                    onChange={(value) => setValue("description", value)}
                  />
                  {errors.description && (
                    <p className="error">{errors.description.message}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={onClose}>
                Đóng
              </Button>
              <Button size="sm" type="submit">
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    );
  }
);

export default ProviderModal;
