import { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import WebRouters from "./routes/webRouters";

function App() {
  return (
    <>
      <WebRouters />
      <ToastContainer position="top-right" autoClose={1500} pauseOnHover />
    </>
  );
}

export default App;
