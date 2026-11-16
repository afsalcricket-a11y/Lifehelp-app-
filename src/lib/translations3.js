// Part 3 strings. Each key: [English, Tamil]
const S = {
  // reporting
  'report.button': ['Report', 'புகார் செய்'],
  'report.title': ['Report a problem', 'சிக்கலைப் புகார் செய்'],
  'report.reason': ['Reason', 'காரணம்'],
  'report.reason.spam': ['Spam or fake', 'ஸ்பேம் அல்லது போலி'],
  'report.reason.scam': ['Scam or fraud', 'மோசடி'],
  'report.reason.inappropriate': ['Inappropriate content', 'பொருத்தமற்ற உள்ளடக்கம்'],
  'report.reason.harassment': ['Harassment or abuse', 'துன்புறுத்தல் அல்லது அவமதிப்பு'],
  'report.reason.false_info': ['False information', 'தவறான தகவல்'],
  'report.reason.other': ['Other', 'மற்றவை'],
  'report.details': ['Details (optional)', 'விவரங்கள் (விருப்பம்)'],
  'report.submit': ['Submit report', 'புகாரை அனுப்பு'],
  'report.sent': ['Thank you. Administrators will review your report.', 'நன்றி. நிர்வாகிகள் உங்கள் புகாரை மதிப்பாய்வு செய்வார்கள்.'],
  'report.already': ['You have already reported this.', 'நீங்கள் ஏற்கனவே இதைப் புகார் செய்துள்ளீர்கள்.'],
  'report.note': ['Reports are reviewed by LIFEHELP administrators. Please report only real problems.', 'புகார்களை LIFEHELP நிர்வாகிகள் மதிப்பாய்வு செய்வார்கள். உண்மையான சிக்கல்களை மட்டும் புகார் செய்யுங்கள்.'],
  'report.type.help_request': ['Community post', 'சமூகப் பதிவு'],
  'report.type.job': ['Job listing', 'வேலை பட்டியல்'],
  'report.type.education': ['Education resource', 'கல்வி வளம்'],
  'report.type.donation': ['Donation item', 'நன்கொடைப் பொருள்'],
  'report.type.blood_request': ['Blood request', 'இரத்த கோரிக்கை'],
  'report.type.profile': ['Profile', 'சுயவிவரம்'],

  // moderation / account state
  'mod.hidden': ['Hidden by moderators', 'நிர்வாகிகளால் மறைக்கப்பட்டது'],
  'mod.suspendedBanner': ['Your account is suspended. You can browse, but you cannot post or respond. If this is a mistake, please contact the LIFEHELP team.', 'உங்கள் கணக்கு இடைநிறுத்தப்பட்டுள்ளது. நீங்கள் பார்க்கலாம்; ஆனால் பதிவிடவோ பதிலளிக்கவோ முடியாது. தவறாக இருந்தால் LIFEHELP குழுவைத் தொடர்பு கொள்ளுங்கள்.'],
  'blood.requestVerification': ['Request verification', 'சரிபார்ப்பைக் கோரு'],
  'blood.verificationRequested': ['Verification requested', 'சரிபார்ப்பு கோரப்பட்டது'],

  // admin: general
  'admin.open': ['Admin dashboard', 'நிர்வாகப் பலகை'],
  'admin.title': ['Admin dashboard', 'நிர்வாகப் பலகை'],
  'admin.subtitle': ['Moderation and verification', 'கட்டுப்பாடு மற்றும் சரிபார்ப்பு'],
  'admin.tab.overview': ['Overview', 'கண்ணோட்டம்'],
  'admin.tab.verification': ['Verification', 'சரிபார்ப்பு'],
  'admin.tab.reports': ['Reports', 'புகார்கள்'],
  'admin.tab.users': ['Users', 'பயனர்கள்'],
  'admin.tab.activity': ['Activity', 'செயல்பாடு'],

  // admin: overview
  'admin.stat.totalUsers': ['Total users', 'மொத்த பயனர்கள்'],
  'admin.stat.activeDonors': ['Active blood donors', 'செயலில் உள்ள இரத்த கொடையாளர்கள்'],
  'admin.stat.openRequests': ['Open community requests', 'திறந்த சமூகக் கோரிக்கைகள்'],
  'admin.stat.pending': ['Pending verifications', 'நிலுவையில் உள்ள சரிபார்ப்புகள்'],
  'admin.stat.openReports': ['Open reports', 'திறந்த புகார்கள்'],
  'admin.stat.suspended': ['Suspended accounts', 'இடைநிறுத்தப்பட்ட கணக்குகள்'],

  // admin: verification
  'admin.ver.donors': ['Blood donors', 'இரத்த கொடையாளர்கள்'],
  'admin.ver.orgs': ['Organisations', 'நிறுவனங்கள்'],
  'admin.ver.pending': ['Pending', 'நிலுவையில்'],
  'admin.ver.unverified': ['Not verified', 'சரிபார்க்கப்படவில்லை'],
  'admin.ver.verified': ['Verified', 'சரிபார்க்கப்பட்டது'],
  'admin.ver.verify': ['Verify', 'சரிபார்'],
  'admin.ver.unverify': ['Mark not verified', 'சரிபார்க்கப்படவில்லை எனக் குறி'],
  'admin.ver.empty': ['Nobody in this list', 'இந்தப் பட்டியலில் யாரும் இல்லை'],
  'admin.ver.hint': ['Contact details are shown to administrators only, to help with verification.', 'சரிபார்ப்புக்கு உதவ, தொடர்பு விவரங்கள் நிர்வாகிகளுக்கு மட்டும் காட்டப்படும்.'],
  'admin.ver.noOrgName': ['No organisation name', 'நிறுவனப் பெயர் இல்லை'],

  // admin: reports
  'admin.rep.open': ['Open', 'திறந்தவை'],
  'admin.rep.resolved': ['Resolved', 'தீர்க்கப்பட்டவை'],
  'admin.rep.dismissed': ['Dismissed', 'நிராகரிக்கப்பட்டவை'],
  'admin.rep.empty': ['No reports here', 'புகார்கள் இல்லை'],
  'admin.rep.by': ['Reported by', 'புகாரளித்தவர்'],
  'admin.rep.owner': ['Posted by', 'பதிவிட்டவர்'],
  'admin.rep.gone': ['This content no longer exists', 'இந்த உள்ளடக்கம் இனி இல்லை'],
  'admin.rep.hide': ['Hide', 'மறை'],
  'admin.rep.restore': ['Restore', 'மீட்டெடு'],
  'admin.rep.remove': ['Remove', 'அகற்று'],
  'admin.rep.confirmRemove': ['Remove this content permanently?', 'இந்த உள்ளடக்கத்தை நிரந்தரமாக அகற்றவா?'],
  'admin.rep.resolve': ['Resolve', 'தீர்வு'],
  'admin.rep.dismiss': ['Dismiss', 'நிராகரி'],
  'admin.rep.closeTitle': ['Close report', 'புகாரை முடி'],
  'admin.rep.note': ['Note (optional)', 'குறிப்பு (விருப்பம்)'],
  'admin.rep.confirm': ['Confirm', 'உறுதிசெய்'],
  'admin.rep.resolvedMsg': ['Report closed', 'புகார் முடிக்கப்பட்டது'],
  'admin.rep.hidden': ['Hidden', 'மறைக்கப்பட்டது'],
  'admin.rep.profileBody': ['Reported profile', 'புகாரளிக்கப்பட்ட சுயவிவரம்'],

  // admin: users
  'admin.users.search': ['Search by name…', 'பெயரால் தேடுங்கள்…'],
  'admin.users.empty': ['No users found', 'பயனர்கள் இல்லை'],
  'admin.users.suspend': ['Suspend', 'இடைநிறுத்து'],
  'admin.users.unsuspend': ['Unsuspend', 'இடைநிறுத்தத்தை நீக்கு'],
  'admin.users.suspended': ['Suspended', 'இடைநிறுத்தப்பட்டது'],
  'admin.users.admin': ['Admin', 'நிர்வாகி'],
  'admin.users.reason': ['Reason (optional)', 'காரணம் (விருப்பம்)'],
  'admin.users.suspendTitle': ['Suspend account', 'கணக்கை இடைநிறுத்து'],
  'admin.users.suspendText': ['The user will no longer be able to post or respond and will disappear from donor search.', 'பயனர் பதிவிடவோ பதிலளிக்கவோ முடியாது; கொடையாளர் தேடலிலும் தெரியமாட்டார்.'],
  'admin.users.joined': ['Joined', 'இணைந்தது'],

  // admin: activity
  'admin.act.empty': ['No admin activity yet', 'நிர்வாகச் செயல்பாடு இல்லை'],
  'admin.act.set_donor_verification': ['Changed donor verification', 'கொடையாளர் சரிபார்ப்பை மாற்றினார்'],
  'admin.act.set_ngo_verified': ['Changed organisation verification', 'நிறுவனச் சரிபார்ப்பை மாற்றினார்'],
  'admin.act.suspend_user': ['Suspended a user', 'பயனரை இடைநிறுத்தினார்'],
  'admin.act.unsuspend_user': ['Unsuspended a user', 'பயனரின் இடைநிறுத்தத்தை நீக்கினார்'],
  'admin.act.hide_content': ['Hid content', 'உள்ளடக்கத்தை மறைத்தார்'],
  'admin.act.restore_content': ['Restored content', 'உள்ளடக்கத்தை மீட்டெடுத்தார்'],
  'admin.act.remove_content': ['Removed content', 'உள்ளடக்கத்தை அகற்றினார்'],
  'admin.act.report_resolved': ['Resolved a report', 'புகாரைத் தீர்த்தார்'],
  'admin.act.report_dismissed': ['Dismissed a report', 'புகாரை நிராகரித்தார்'],
  'admin.act.by': ['by', 'செய்தவர்'],
};

export const part3En = Object.fromEntries(Object.entries(S).map(([k, v]) => [k, v[0]]));
export const part3Ta = Object.fromEntries(Object.entries(S).map(([k, v]) => [k, v[1]]));
