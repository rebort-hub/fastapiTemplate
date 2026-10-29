import { notifyError, notifySuccess } from "@/lib/http"

const useCustomToast = () => ({
  showSuccessToast: notifySuccess,
  showErrorToast: notifyError,
})

export default useCustomToast
