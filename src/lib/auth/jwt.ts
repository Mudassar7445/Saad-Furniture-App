import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'saad_furniture_super_secret_jwt_key_2026_luxury_brand';
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET_STRING);

export interface TokenUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'staff' | 'customer';
  permissions: string[];
  status: string;
}

export async function signToken(user: TokenUser): Promise<string> {
  return await new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
    status: user.status,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET_KEY);
}

export async function verifyToken(token: string): Promise<TokenUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as 'super_admin' | 'staff' | 'customer',
      permissions: (payload.permissions as string[]) || [],
      status: payload.status as string,
    };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<TokenUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('saad_session')?.value;
  if (!token) return null;
  return await verifyToken(token);
}

