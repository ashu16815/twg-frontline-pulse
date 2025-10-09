import 'dotenv/config';
import sql from 'mssql';
import bcrypt from 'bcryptjs';

const users = [
  { user_id: '323905', full_name: 'Ankit Gupta', password: 'Ankit@1993', email: null, role: 'Admin' },
  { user_id: '310397', full_name: 'Ian Carter', password: 'Ian@2025', email: null, role: 'ELT' }
];

console.log('👥 Seeding users...');

const pool = await sql.connect(process.env.AZURE_SQL_CONNECTION_STRING);

for (const u of users) {
  const hash = await bcrypt.hash(u.password, 12);
  
  await pool.request().query`
    merge dbo.app_users as t 
    using (select ${u.user_id} as user_id) s 
    on t.user_id = s.user_id 
    when matched then 
      update set 
        full_name = ${u.full_name}, 
        email = ${u.email}, 
        role = ${u.role}, 
        password_hash = ${hash}, 
        is_active = 1 
    when not matched then 
      insert (user_id, full_name, email, role, password_hash, is_active) 
      values (${u.user_id}, ${u.full_name}, ${u.email}, ${u.role}, ${hash}, 1);
  `;
  
  console.log(`   ✓ Upserted user: ${u.user_id} (${u.full_name})`);
}

console.log('✅ Users seeded successfully');
process.exit(0);

