-- Sans valeur par défaut, un insert qui omet user_id est rejeté par les
-- policies RLS (auth.uid() = user_id ne peut jamais être vrai si user_id
-- est null). On fait remplir la colonne automatiquement par la session.

alter table assets alter column user_id set default auth.uid ();
alter table goals alter column user_id set default auth.uid ();
alter table contributions alter column user_id set default auth.uid ();
alter table push_subscriptions alter column user_id set default auth.uid ();
