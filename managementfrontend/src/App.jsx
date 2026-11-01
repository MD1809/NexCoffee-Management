import { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import WebRouters from "./routes/WebRouters";

function App() {
  return (
    <>
      <WebRouters />
      <ToastContainer
        position="top-right"
        autoClose={1800}
        pauseOnHover
        limit={3}
      />
    </>
  );
}

export default App;
