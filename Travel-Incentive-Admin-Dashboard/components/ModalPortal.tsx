import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const ModalPortal: React.FC<{ children: React.ReactNode, containerId?: string }> = ({ children, containerId }) => {
  const elRef = useRef<HTMLDivElement | null>(null);
  if (!elRef.current) {
    elRef.current = document.createElement('div');
    elRef.current.className = 'modal-portal';
  }

  useEffect(() => {
    const target = (containerId && document.getElementById(containerId)) || document.body;
    target.appendChild(elRef.current!);
    return () => {
      try { target.removeChild(elRef.current!); } catch (e) { /* ignore */ }
    };
  }, [containerId]);

  return createPortal(children, elRef.current!);
};

export default ModalPortal;
