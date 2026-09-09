import RoleLogin from './RoleLogin';
import { ROUTES } from '../constants/routes';

export default function DoctorLogin() {
  return (
    <RoleLogin
      role="doctor"
      title="Doctor Login"
      subtitle="Access your doctor dashboard"
      signupPath={ROUTES.doctorSignup}
      signupLabel="New doctor?"
      alternateLoginPath={ROUTES.login}
      alternateLoginLabel="Patient / general login"
    />
  );
}
