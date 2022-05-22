// ==UserScript==
// @name         Improved AWS SAML Page
// @namespace    ~rukenshia
// @version      1.0
// @description  Provides a better SAML Page for AWS
// @author       Jan Christophersen
// @homepage     https://github.com/Rukenshia/improved-saml-aws-page
// @updateURL    https://raw.githubusercontent.com/Rukenshia/improved-saml-aws-page/main/dist/improved_saml_page.user.js
// @downloadURL  https://raw.githubusercontent.com/Rukenshia/improved-saml-aws-page/main/dist/improved_saml_page.user.js
// @match        https://signin.aws.amazon.com/saml
// @run-at       document-end
// @grant        none
// ==/UserScript==

// Sets the order of accounts by their stage (last part of the name)
const ACCOUNT_STAGE_PRIORITY = ['dev', 'staging', 'int', 'cons', 'prod'];

// Default rendering for roleName: remove the IAM Role Path
const renderRoleName = (roleName) => roleName.split('/').pop();

// TODO: make this more configurable: the current issue is that when publishing, we inline the
// tailwind style automatically, meaning you cannot add any new colors to this object.
const stageStyling = {
  dev: {
    buttonClasses:
      'text-black font-medium bg-amber-500 hover:bg-amber-600 dark:bg-amber-500/80 dark:hover:bg-amber-600',
  },
  staging: {
    buttonClasses:
      'text-black font-medium bg-amber-500 hover:bg-amber-600 dark:bg-amber-500/80 dark:hover:bg-amber-600',
  },
  int: {
    buttonClasses:
      'font-medium bg-amber-400/20 hover:bg-amber-500 dark:bg-amber-500/20 dark:hover:bg-amber-800',
  },
  cons: {
    buttonClasses:
      'font-medium bg-amber-400/20 hover:bg-amber-500 dark:bg-amber-500/20 dark:hover:bg-amber-800',
  },
  prod: {
    buttonClasses: 'text-white font-medium bg-red-600 hover:bg-red-700',
  },
};

const defaultStyleOverride = `
  /* we are creating a container around the aws logo, this is a copy of the #container>h1.background rule with small adjustments */
  h1.background{background-position:.1em 0;background-repeat:no-repeat;background-size:contain;color:rgba(0,0,0,0);height:50px;width:84px;background-image:url("data:image/png;base64,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");font-size:1em}`;

let groupSearchIndex = [];
let selectedTheme = (() => {
  const storedTheme = localStorage.getItem('__improved_saml_page_theme');

  if (storedTheme) {
    return storedTheme;
  }

  if (!window.matchMedia) {
    return 'light';
  }

  if (window.matchMedia('(prefers-color-scheme: dark)')) {
    return 'dark';
  }

  return 'light';
})();

const main = function () {
  injectStylesheets();
  updateBaseStyle();
  switchTheme(selectedTheme);

  function render(parentElement, groups) {
    groupSearchIndex = [];
    parentElement.innerHTML = '';

    groups.forEach((roles, name) => {
      const renderedRoles = [];
      roles.forEach((accounts, roleName) => {
        accounts = accounts.sort((a, b) =>
          ACCOUNT_STAGE_PRIORITY.indexOf(a.name.replace(`${name}-`, '')) >
          ACCOUNT_STAGE_PRIORITY.indexOf(b.name.replace(`${name}-`, ''))
            ? 1
            : -1
        );

        const accountTpl = `
            <button class="account flex-grow rounded-md px-2 py-1 text-base hover:scale-110 transition-color transition-transform {{an_style}}" id="{{an}}" data-role-name="${roleName}" data-account-name="{{fn}}" onclick="signIn(this)" tabindex="0">
              <input type="hidden" value="{{ra}}" id="{{ra}}"/>
              {{an}}
            </button>
            `;

        renderedRoles.push(`
          <div class="role flex flex-col drop-shadow">
            <h3 class="${roleName} text-base bg-gray-200 dark:bg-gray-700 px-2 rounded-t">${renderRoleName(
          roleName
        )}</h3>
            <div class="flex gap-2 border-2 border-gray-200 dark:border-gray-700 rounded-b p-2">
            ${accounts
              .map((account) =>
                accountTpl
                  .replace(/\{\{an\}\}/g, account.name.replace(`${name}-`, ''))
                  .replace(
                    /\{\{an_style\}\}/g,
                    (
                      stageStyling[account.name.replace(`${name}-`, '')] || {
                        buttonClasses:
                          'bg-amber-500 dark:bg-amber-500/80 hover:bg-amber-600',
                      }
                    ).buttonClasses
                  )
                  .replace(/\{\{fn\}\}/g, account.name)
                  .replace(/\{\{ra\}\}/g, account.roleArn)
              )
              .join('\n')}
            </div>
          </div>`);
      });

      const groupElement = document.createElement('div');
      groupElement.id = name;
      groupElement.innerHTML = `
        <div class="grid grid-cols-3 mt-2 mb-2">
          <div class="self-center">
              <h2 class="text-lg font-medium ${name}">${name}</h2>
          </div>
          <div class="col-span-2 flex flex-wrap gap-2">
            ${renderedRoles.join('\n')}
          </div>
        </div>
      `;
      parentElement.appendChild(groupElement);

      groupSearchIndex.push(groupElement);
    });

    // register 'Enter' handler
    Array.from(document.querySelectorAll('div.account')).forEach((el) => {
      el.addEventListener('keydown', (ev) => {
        if (ev.keyCode === 13) {
          signIn(el);
        }
      });
    });

    updateClosestMatch();
  }

  (() => {
    if (!document.getElementById('signin_button')) {
      return;
    }

    const accounts = parseAccounts();

    window.pageElements = createCustomElements();

    // scroll back to top because we added elements
    window.scrollTo({ top: 0 });

    render(
      window.pageElements.groupsListElement,
      getGroupsFromAccounts(accounts)
    );
  })();
};

/** Injects the custom stylesheet used for the updated page
 *
 * A global "window.tailwind" variable is set for the bundled release which is a minified
 * version of tailwind. If this variable is not present (for example in development or when
 * a user chooses to custimze styles), the CDN version of tailwind is used.
 */
function injectStylesheets() {
  const head = document.querySelectorAll('head')[0];

  if (!window.tailwind) {
    // local development
    const tailwind = document.createElement('link');
    tailwind.rel = 'stylesheet';
    tailwind.href = './dist/tailwind.css';
    head.appendChild(tailwind);
  } else {
    const tailwind = document.createElement('style');
    tailwind.innerText = window.tailwind;
    head.appendChild(tailwind);
  }

  const styleOverride = document.createElement('style');
  styleOverride.innerHTML = defaultStyleOverride;
  head.appendChild(styleOverride);
}

/**
 * Updates some elements from the default AWS SAML page to make it look better
 * and fit with the style we want, for example:
 *
 * - Removing borders from the page
 * - Styling the logo with a vertical bar
 * - Setting background colors
 */
function updateBaseStyle() {
  // add styling to body
  const body = document.querySelector('body');
  body.className =
    'bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-gray-200';

  // change container styling so that we can pull the smallprint to the bottom of the page
  const container = document.querySelector('#container');
  container.className = 'flex-grow flex flex-col min-h-screen';

  const containerWrapper = document.createElement('div');
  containerWrapper.className = 'flex w-full h-full';

  container.parentNode.prepend(containerWrapper);
  container.remove();
  containerWrapper.appendChild(container);

  // fix header styling
  const header = document.querySelector('#container>h1.background');
  // add a wrapper div around the header for the logo design
  const headerWrapper = document.createElement('div');
  headerWrapper.className =
    'bg-gray-200 p-4 flex flex-col justify-between items-center';
  headerWrapper.style.width = 'calc(84px + 2rem)';

  const githubLink = document.createElement('div');
  githubLink.className = 'flex justify-around';
  githubLink.innerHTML =
    '<a target="_blank" href="https://github.com/Rukenshia/improved-saml-aws-page"><svg class="w-8 h-8" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>GitHub</title><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg></a>'; // from https://simpleicons.org/

  const themeSwitcher = document.createElement('div');
  themeSwitcher.className = 'flex-grow mt-8 items-center';
  themeSwitcher.innerHTML = `
    <button id="theme-switcher" type="button" class="bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-200 transition-transform transition-color hover:scale-110 drop-shadow-sm rounded-full p-2">
    </button>
  `;
  themeSwitcher.querySelector('button').addEventListener('click', toggleTheme);

  header.remove();
  headerWrapper.appendChild(header);
  headerWrapper.appendChild(themeSwitcher);
  headerWrapper.appendChild(githubLink);
  containerWrapper.prepend(headerWrapper);

  // remove border from content styling
  document.querySelector('#content').style.borderTop = 'none';
  // use flex-grow so that smallprint always ends up at the bottom
  document.querySelector('#content').classList.add('flex-grow');
  // adjust styling of the language selector
  document
    .querySelector('#languageSelector')
    .classList.add(
      'bg-gray-600',
      'rounded',
      'px-4',
      'py-2',
      'text-gray-100',
      'text-base'
    );

  // remove "Select a role" p element
  document.querySelector('form>p').remove();

  // add a background for the footer, do not modify footer content
  document
    .querySelector('#smallprint')
    .classList.add('bg-gray-700', 'text-gray-50', 'pb-4');
  document.querySelector('.language-dropdown').style.borderTop = 'none';
}

function createSearchElement() {
  const el = document.createElement('div');
  el.className = 'flex';
  el.innerHTML = `
      <div class="bg-gray-200 dark:bg-gray-700 rounded-md p-4 flex flex-col gap-2">
        <div class="flex gap-2 items-center">
          <span class="text-2xl text-orange-400">&#10095;</span>
          <input tabindex="0" type="text" id="search" name="search" class="flex-grow text-2xl text-orange-400 bg-gray-200 dark:bg-gray-700 outline-none border-b-orange-400/70 focus:border-b-orange-400 border-b-2 font-light dark:placeholder:text-gray-500" placeholder="search account" autofocus>
        </div>

        <p class="mt-2 text-xs dark:text-gray-400">Closest match: <strong id="closestMatch"></strong>. Press <span class="bg-gray-400 dark:bg-gray-600 rounded text-white px-2 py-0.5">Return</span> to directly jump into the account. You can also cycle through accounts by pressing &lt;Tab&gt; and use the Return key to log in.</p>
      </div>
    `;

  el.addEventListener('keydown', (ev) => {
    if (ev.keyCode === 13) {
      ev.preventDefault();

      // find first visible group + account
      const { account } = getClosestMatch();
      signIn(account);

      return false;
    }
  });

  const input = el.querySelector('input');
  el.addEventListener('input', (_) => search(groupSearchIndex, input.value));
  return el;
}

/** Creates custom HTML elements that are used to provide this scripts main functionality
 */
function createCustomElements() {
  const fs = document.getElementsByTagName('fieldset')[0];
  const parent = fs.parentElement;
  parent.className = 'flex flex-col';
  fs.remove();

  // This input field is used to let AWS know what account we want to log in to
  const roleIndexElement = document.createElement('input');
  roleIndexElement.type = 'hidden';
  roleIndexElement.value = 'none';
  roleIndexElement.name = 'roleIndex';
  parent.insertBefore(roleIndexElement, parent.children[5]);

  // A custom search bar
  const searchElement = createSearchElement();
  parent.insertBefore(searchElement, parent.children[5]);
  searchElement.focus();

  // A custom list of groups
  const groupsListElement = document.createElement('div');
  groupsListElement.className =
    'mt-8 flex flex-col divide-y-2 divide-gray-600 divide-dotted';
  groupsListElement.id = 'groups';
  parent.insertBefore(groupsListElement, parent.children[6]);

  return {
    groupsListElement,
    searchElement,
    roleIndexElement,
  };
}

/**
 * Finds all AWS accounts listed in the default AWS SAML Page.
 *
 * For each account, all IAM roles that can be assumed are returned as well.
 */
function parseAccounts() {
  const elements = document.querySelectorAll('fieldset > div.saml-account');
  document.getElementById('signin_button').style.visibility = 'hidden';
  const accounts =
    window.accounts ||
    Array.from(elements).map((acc) => {
      const name = acc.children[0].innerText
        .replace('Account: ', '')
        .replace(/\([0-9]+.*$/, '')
        .trim();

      const roles = Array.from(
        acc.querySelectorAll('.saml-account > div.saml-role')
      ).map((role) => ({
        id: role.id,
        name: Array.from(role.querySelectorAll('* label'))[0].innerText,
        arn: Array.from(role.querySelectorAll('* input[type=radio]'))[0].value,
      }));

      return {
        name,
        roles,
      };
    });

  return accounts;
}

/**
 * Returns a Map of "Groups" of accounts. A group is determined by the name of the accounts
 * without the last part of their name (based on '-' as separator). The last part of an
 * accounts' name is assumed to be their stage/environment.
 */
function getGroupsFromAccounts(accounts) {
  const groups = new Map();
  accounts.forEach((account) => {
    // get longest possible name
    const groupName = account.name.slice(0, account.name.lastIndexOf('-'));

    if (!groups.has(groupName)) {
      groups.set(groupName, new Map());
    }

    const group = groups.get(groupName);

    account.roles.forEach((role) => {
      if (!group.has(role.name)) {
        group.set(role.name, []);
      }

      const accountsInRole = group.get(role.name);
      accountsInRole.push({
        name: account.name,
        roleName: role.name,
        roleArn: role.arn,
      });
      group.set(role.name, accountsInRole);
    });

    groups.set(groupName, group);
  });

  return groups;
}

/** Updates results based on the search input
 *
 * The search tries to be somewhat smart. Generally, our assumption is that accounts
 * are grouped by their name, followed by several stages/environments for this account group.
 * For more information, check the getGroupsFromAccounts function.
 *
 * When searching, the user can start by typing a group name and without adding any dashes,
 * can follow it up with the name of the stage/environment.
 *
 * If there are the following accounts:
 *
 * - my-account-dev
 * - my-account-prod
 * - your-account-dev
 *
 * And the search query is "accp", only "my-account-prod" will be visible.
 */
function search(groupElements, query) {
  // If we are already at a level
  // where we only have one group left, the user _might_ be
  // typing in the stage name. But if we have
  // group names: ['foo', 'my-accounts']
  // and the filter is 'my', there is only one group. The next filter could
  // very well be 'my-' and so on, which is just extending the group name
  // and not yet looking for a stage. We need to take that into account
  function filterGroup(group) {
    let smartFilter = query;
    const searchAccount = (accountFilter) => {
      const accounts = group.querySelectorAll('button.account');

      Array.from(accounts).forEach((account) => {
        const visible = account.id.startsWith(accountFilter);

        // Toggle visibility for the account
        account.classList.toggle('hidden', !visible);
        if (visible) {
          account.removeAttribute('hidden');
        } else {
          account.setAttribute('hidden', 'hidden');
        }
      });
    };

    if (group.id.includes(smartFilter)) {
      group._lastMatchedFilter = smartFilter;
    }

    let accountFilter = smartFilter.replace(group._lastMatchedFilter, '');
    if (accountFilter.startsWith('-')) {
      accountFilter = accountFilter.slice(1);
    }

    // Adjust the group filter so it only queries the actual groups
    smartFilter = smartFilter.replace(accountFilter, '');

    if (smartFilter.endsWith('-')) {
      smartFilter = smartFilter.slice(0, smartFilter.length - 1);
    }

    searchAccount(accountFilter);

    // Determine whether the entire group should be hidden
    const visible =
      Array.from(group.querySelectorAll('button.account')).filter(
        (button) => !button.hasAttribute('hidden')
      ).length > 0;

    group.classList.toggle('hidden', !visible);
    if (visible) {
      group.removeAttribute('hidden');
    } else {
      group.setAttribute('hidden', 'hidden');

      // We don't need to hide any accounts if the entire group is hidden
      return;
    }

    // Hide the role if there are no more accounts left for the given query
    // For example: Developer@my-account-dev, Administrator@my-account-prod and the query is
    // "acc-prod", hide the "Developer" role from the group
    Array.from(group.querySelectorAll('.role')).forEach((role) => {
      const shouldBeVisible =
        Array.from(role.querySelectorAll('button.account')).filter(
          (button) => !button.hasAttribute('hidden')
        ).length > 0;

      role.classList.toggle('hidden', !shouldBeVisible);
    });
  }

  groupElements.forEach((group) => filterGroup(group));

  // update closest match
  updateClosestMatch();
}

/**
 * Returns the closest matching group and account for the current search query.
 */
function getClosestMatch() {
  const group = groupSearchIndex.find((el) => !el.hasAttribute('hidden'));
  if (!group) {
    return { group, account: null };
  }

  const account = Array.from(group.querySelectorAll('button.account')).find(
    (el) => !el.hasAttribute('hidden')
  );
  if (!account) {
    return { group, account };
  }

  return { group, account };
}

/**
 * Updates the "Closest match" text in the search box
 */
function updateClosestMatch() {
  const closestMatchEl = document.getElementById('closestMatch');
  const closestMatch = getClosestMatch();

  if (!closestMatch.group || !closestMatch.account) {
    closestMatchEl.innerText = 'none';
  } else {
    closestMatchEl.innerText = `${renderRoleName(
      closestMatch.account.dataset.roleName
    )}@${closestMatch.account.dataset.accountName}`;
    closestMatchEl.classList.add(closestMatch.account.dataset.roleName);
  }
}

/**
 * Updates the theme to the selected value
 */
function switchTheme(mode) {
  const themeSwitchButton = document.querySelector('#theme-switcher');
  selectedTheme = mode;
  localStorage.setItem('__improved_saml_page_theme', mode);

  if (mode === 'dark') {
    document.querySelector('html').classList.add('dark');

    // update svg
    themeSwitchButton.innerHTML = `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path></svg>`;
  } else if (mode === 'light') {
    document.querySelector('html').classList.remove('dark');

    // update svg
    themeSwitchButton.innerHTML = `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>`;
  }
}

/**
 * Toggles the theme
 */
function toggleTheme() {
  if (selectedTheme === 'dark') {
    switchTheme('light');
  } else if (selectedTheme === 'light') {
    switchTheme('dark');
  }
}

/** Signs in to an AWS Account **/
function signIn(div) {
  window.pageElements.roleIndexElement.value = div.firstElementChild.value;

  document.getElementById('signin_button').click();
}
window.signIn = signIn;

main();
