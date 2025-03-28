const Footer = () => {
  return (
    <footer className="fixed bg-white bottom-0 left-0 w-full dark:bg-gray-900">
      <hr className=" border-gray-200 sm:mx-auto dark:border-gray-700" />

      <div className="mx-auto w-full max-w-screen-xl p-4 py-6">
        <div className="sm:flex sm:items-center sm:justify-end">
          <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
            © 2025{" "}
            <a href="https://www.cgvtelecom.vn/" className="hover:underline">
              CGV_TELECOM
            </a>
            . All Rights Reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
