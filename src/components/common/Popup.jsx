function Popup({
  show,
  type = "info",
  message,
  onClose,
  onConfirm,
  onResend,
  showConfirm = false,
  showResend = false,
}) {
  if (!show) return null;

  const getTitle = () => {
    switch (type) {
      case "success":
        return "Success";
      case "error":
        return "Error";
      case "confirm":
        return "Confirm";
      default:
        return "Info";
    }
  };

  const getColor = () => {
    switch (type) {
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-500";
      case "confirm":
        return "text-yellow-600";
      default:
        return "text-black";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-80 text-center shadow-lg">

        <h2 className={`text-lg font-bold mb-3 ${getColor()}`}>
          {getTitle()}
        </h2>

        <p className="mb-5 text-gray-700">{message}</p>

        <div className="flex justify-center gap-3">

          {showResend && (
            <button
              onClick={onResend}
              className="bg-gray-200 px-3 py-1 rounded"
            >
              Resend
            </button>
          )}

          {showConfirm && (
            <button
              onClick={onConfirm}
              className="bg-black text-white px-3 py-1 rounded"
            >
              Confirm
            </button>
          )}

          <button
            onClick={onClose}
            className="border border-black px-3 py-1 rounded"
          >
            OK
          </button>

        </div>
      </div>
    </div>
  );
}

export default Popup;