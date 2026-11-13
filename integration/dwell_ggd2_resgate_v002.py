"""GGD2 read-only recovery UI; routes run after the existing session gate."""
VERSION = "0.2.0"
CSP = (
    "default-src 'self'; script-src 'self' https://accounts.google.com/gsi/client; "
    "style-src 'self' https://accounts.google.com/gsi/style; "
    "connect-src 'self' https://www.googleapis.com https://accounts.google.com/gsi/; "
    "frame-src https://accounts.google.com/gsi/; img-src 'self' data:; "
    "font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; "
    "form-action 'self'"
)

def handle(monitor, env, start, rel, method, session):
    if not session:
        return monitor.respond(start, '401 Unauthorized', {'ok': False, 'error': 'LOGIN_REQUIRED'})
    if method != 'GET':
        return monitor.respond(start, '405 Method Not Allowed', {'ok': False, 'error': 'READ_ONLY'}, extra=[('Allow','GET')])
    if rel == '/api/resgate-ggd2/version':
        return monitor.respond(start, '200 OK', {'version': VERSION, 'read_only_ui': True,
            'backup_complete': None, 'depends_on_mac': False, 'data_proxy': False,
            'fallback': 'https://dwelllabs.github.io/dwell-ggd2-resgate/'})
    if rel != '/resgate-ggd2':
        return monitor.respond(start, '404 Not Found', {'ok': False})
    def protected_start(status, headers, exc_info=None):
        # Only this HTML route may load Google Identity Services. Other modules remain unchanged.
        remove={'content-security-policy','referrer-policy','cross-origin-opener-policy','x-robots-tag'}
        safe=[(key,value) for key,value in headers if key.lower() not in remove]
        safe += [('Content-Security-Policy',CSP), ('Referrer-Policy','no-referrer'),
                 ('Cross-Origin-Opener-Policy','same-origin-allow-popups'),
                 ('X-Robots-Tag','noindex, nofollow, noarchive'), ('X-Dwell-GGD2-Version',VERSION)]
        return start(status,safe,exc_info) if exc_info is not None else start(status,safe)
    return monitor.respond(protected_start, '200 OK', monitor.page('ggd2-resgate-v002.html', session.get('csrf','')),
                           'text/html; charset=utf-8')
