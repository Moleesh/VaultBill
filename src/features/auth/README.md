<!-- @format -->

Phase 3 adds operator account context, bootstrap helpers, and active-account
limit validation. Desktop and hosted login now show a password field only when
an account has one configured, while local demo accounts stay browser-only and
can remain without a password until you set credentials in Settings. SysAdmin
still uses the hidden F8 unlock path on desktop and always requires a
password.
