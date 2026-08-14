import { useEffect, useState } from "react";

/** Roles of the signed-in user; empty for guests. */
export function useMyRoles() {
  const [authed, setAuthed] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    const authStatus = localStorage.getItem("agnivega_auth");
    setAuthed(Boolean(authStatus));
    if (authStatus) {
      // Dummy mapping, if they selected admin they get admin, otherwise farmer/driver.
      setRoles([authStatus]);
    } else {
      setRoles([]);
    }
  }, []);

  return { roles, isAdmin: roles.includes("admin"), ready: true };
}
