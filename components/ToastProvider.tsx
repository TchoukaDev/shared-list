"use client"

import { ToastContainer } from "react-toastify"

export default function ToastProvider() {
  return (
    <ToastContainer
      position="bottom-center"
      autoClose={3000}
      hideProgressBar
      closeOnClick
      pauseOnHover={false}
      theme="colored"
    />
  )
}
