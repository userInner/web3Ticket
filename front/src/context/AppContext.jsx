import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export function useAppContext() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // 辅助函数：显示通知，并在5秒后自动清除
  const showNotification = (message, type = "info", duration = 5000) => {
    if (type === "success") {
      setSuccessMessage(message);
      setErrorMessage("");
    } else if (type === "error") {
      setErrorMessage(message);
      setSuccessMessage("");
    } else { // 'info' or other types
      setSuccessMessage(message); // Using success for info for now
      setErrorMessage("");
    }
    setTimeout(() => { setSuccessMessage(""); setErrorMessage(""); }, duration);
  };

  const value = {
    showNotification,
    errorMessage, // 让 Notifications 组件可以消费
    successMessage, // 让 Notifications 组件可以消费
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}