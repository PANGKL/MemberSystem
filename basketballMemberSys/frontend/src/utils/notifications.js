import { useToast } from 'vuestic-ui';

export const useNotifications = () => {
  const { init } = useToast();

  const notifySuccess = (message) => {
    init({
      message,
      color: 'success',
      position: 'bottom-right',
    });
  };

  const notifyError = (message) => {
    init({
      message,
      color: 'danger',
      position: 'bottom-right',
    });
  };

  const notifyWarning = (message) => {
    init({
      message,
      color: 'warning',
      position: 'bottom-right',
    });
  };

  const notifyInfo = (message) => {
    init({
      message,
      color: 'info',
      position: 'bottom-right',
    });
  };

  return {
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
  };
};
