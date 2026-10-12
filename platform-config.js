'use strict';
// Verified against the existing Arvena project. Independent of sourcing.
window.ARVENA_PLATFORM_ENABLED = true;
// Enable only after custom SMTP, confirmation/reset delivery and redirect URLs
// are configured and verified. Existing confirmed accounts can still sign in.
window.ARVENA_EMAIL_DELIVERY_ENABLED = false;
// Enable only after the additive owner-publishing migration and Storage policies
// have been applied and verified in the intended environment.
window.ARVENA_OWNER_PUBLISHING_ENABLED = false;
