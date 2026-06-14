"use client";

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

  const baseClasses = "relative flex items-center justify-center shrink-0 overflow-hidden shadow-sm";
  
  return (
    <div 
      className={`${baseClasses} ${className}`} 
      style={{ backgroundColor: avatarUrl ? "transparent" : avatarBgColor }}
      onClick={onClick}
    >
      {avatarUrl ? (
        <Image 
          src={avatarUrl} 
          alt="Profile picture" 
          fill 
          className="object-cover bg-white" 
        />
      ) : (
        <span className="text-white font-medium uppercase w-full h-full flex items-center justify-center" style={{ fontSize: "inherit" }}>
          {initial}
        </span>
      )}
    </div>
  );
}
