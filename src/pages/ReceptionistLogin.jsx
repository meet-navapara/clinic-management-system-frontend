import RoleLogin from './RoleLogin';
import { ROUTES } from '../constants/routes';

export default function ReceptionistLogin() {
  return (
    <RoleLogin
      role="receptionist"
      title="Receptionist Login"
      subtitle="Manage patients and appointments"
      signupPath={ROUTES.receptionistSignup}
      signupLabel="New receptionist?"
      alternateLoginPath={ROUTES.login}
      alternateLoginLabel="General login"
    />
  );
}
