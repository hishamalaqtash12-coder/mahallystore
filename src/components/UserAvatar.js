"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function UserAvatar({
  user,
  customerName,
  email,
  avatarUrl,
  avatarBgColor = "#9b8676",
  className = "",
  onClick,
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [avatarUrl]);

  // Determine initial character
  let initial = "U";
  if (customerName) {
    initial = customerName.charAt(0).toUpperCase();
  } else if (user?.displayName) {
    initial = user.displayName.charAt(0).toUpperCase();
  } else if (user?.email) {
    initial = user.email.charAt(0).toUpperCase();
  } else if (email) {
    initial = email.charAt(0).toUpperCase();
  }

  const showImage = Boolean(avatarUrl && !hasError);
  const baseClasses = "relative flex items-center justify-center shrink-0 overflow-hidden shadow-sm select-none";
  
  return (
    <div 
      className={`${baseClasses} ${className}`} 
      style={{ backgroundColor: showImage ? "transparent" : avatarBgColor }}
      onClick={onClick}
    >
      {showImage ? (
        <Image 
          src={avatarUrl} 
          alt="Profile picture" 
          fill 
          className="object-cover bg-white" 
          onError={() => setHasError(true)}
        />
      ) : (
        <span className="text-white font-bold uppercase w-full h-full flex items-center justify-center" style={{ fontSize: "inherit" }}>
          {initial}
        </span>
      )}
    </div>
  );
}

