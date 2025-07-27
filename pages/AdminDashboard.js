import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import DashboardContent from '../components/DashboardContent';

export async function getServerSideProps({ req }) {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.auth;

  if (!token) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    return {
      props: {
        user: {
          id: payload.id,        // ✅ use id instead of sub
          email: payload.email,
        },
      },
    };
  } catch (e) {
    console.error('JWT verification failed:', e.message);

    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
}

export default function AdminDashboard({ user }) {
  return <DashboardContent user={user} />;
}
