import { useModal } from 'vuestic-ui';

export const useConfirm = () => {
  const { confirm } = useModal();

  const confirmAction = async ({
    title = '確認操作',
    message = '您確定要執行此操作嗎？',
    okText = '確定',
    cancelText = '取消',
    onOk,
    onCancel,
  }) => {
    const result = await confirm({
      title,
      message,
      okText,
      cancelText,
    });

    if (result) {
      if (onOk) onOk();
    } else {
      if (onCancel) onCancel();
    }
    return result;
  };

  return {
    confirmAction,
  };
};
