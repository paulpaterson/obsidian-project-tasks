"""Do some pre-release actions to make sure the repo is in a good state"""

import os

print('Clearing settings to force use of defaults ...', end=' ')
with open(os.path.join('..', 'data.json'), 'w') as f:
    f.write('{}')
print('done')

print('Resetting DEBUG status ...', end=' ')
with open(os.path.join('..', 'helpers.ts'), 'r') as f:
    code = f.read()
    code = code.replace('export const DEBUG = true;', 'export const DEBUG = false;')

with open(os.path.join('..', 'helpers.ts'), 'w') as f:
    f.write(code)
print('done')

