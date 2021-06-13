import React from "react";
import MenuList from "../containers/MenuList";
import styles from "./Modal.module.css";

const Modal = () => (
  <div className="container">
    <div className={styles.modalBorder}>
      <MenuList />
    </div>
  </div>
);

export default Modal;
