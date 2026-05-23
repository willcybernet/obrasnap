-- Permite visualização pública dos dados do escritório na página compartilhada
CREATE POLICY "users_select_public" ON public.users
  FOR SELECT USING (true);
