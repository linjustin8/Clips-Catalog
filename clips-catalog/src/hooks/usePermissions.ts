import useAuth from "./useAuth";

const usePermissions = () => {
  const { user } = useAuth();

  const hasRole = (requiredRole: string) =>
    Boolean(
      user?.roles.some(
        (role) => role.toLowerCase() === requiredRole.toLowerCase()
      )
    );

  return {
    hasRole,
    isAdmin: hasRole("admin"),
  };
};

export default usePermissions;
