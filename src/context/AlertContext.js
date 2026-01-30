import React, { createContext, useContext, useState } from "react";
import GlobalAlert from "../components/GlobalAlert";

const AlertContext = createContext();

export function AlertProvider({ children }) {
  const [alert, setAlert] = useState({
    visible: false,
    type: "success",
    title: "",
    message: "",
  });

  const showSuccess = (title, message) => {
    setAlert({
      visible: true,
      type: "success",
      title,
      message,
    });
  };

  const showError = (title, message) => {
    setAlert({
      visible: true,
      type: "error",
      title,
      message,
    });
  };

  const hideAlert = () => {
    setAlert(prev => ({ ...prev, visible: false }));
  };

  return (
    <AlertContext.Provider value={{ showSuccess, showError }}>
      {children}

      <GlobalAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={hideAlert}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  return useContext(AlertContext);
}
