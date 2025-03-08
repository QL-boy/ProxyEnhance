# Proxy Enhance

Proxy Enhance is an Obsidian plugin with version 1.0.0, and it requires a minimum Obsidian application version of 0.15.0. This plugin is specifically designed for the desktop version, aiming to provide built-in web proxy support for Obsidian, helping users configure web proxies easily and use these proxies throughout the entire Obsidian application. The currently supported proxy types include socks, http, and https, which are suitable for users in areas with network restrictions. You can obtain this plugin through the [Github repository](https://github.com/QL-boy). If you find this plugin helpful, you can also support the developer through the [donation link](https://buymeacoffee.com/lragonstarr).

## Feature Highlights
1. **Support for Multiple Proxy Types**: It supports socks, http, and https proxies to meet the network needs of different users.
2. **Intelligent Proxy Selection**: If both socks and http/https proxies are set, the plugin will prioritize using the socks proxy. If it fails, it will then try the http/https proxy. If that still fails, it will make the request directly.
3. **Plugin Token Support**: For some plugins that maintain their own network connections and do not use Obsidian's default session, users can declare plugin tokens to proxy their network traffic.
4. **Blacklist Function**: Users can set up a blacklist to specify which URLs should not use the proxy. The bypass list is a comma-separated list of rules.
5. **PAC Mode Configuration**: It supports PAC (Proxy Auto-Configuration) mode, including subscribing to PAC files and manually setting local PAC rules.
6. **Language Switching**: It supports two languages, English and Chinese, making it convenient for users in different regions to use.
7. **Proxy Connection Testing**: It provides a proxy connection testing feature. Users can input a test URL and click the button to test whether the proxy is working properly.

## Installation Method
Copy the plugin file to the Obsidian plugin directory, and then enable the plugin in Obsidian's settings.

## Usage
### Basic Proxy Settings
1. **Enable the Proxy**: In the plugin settings, toggle the "Enable Proxy" switch to turn the proxy function on or off.
2. **Select the Proxy Mode**: It supports "Basic Mode" and "Advanced Mode".
    - **Basic Mode**: Just fill in a basic proxy address in the format of `<scheme>://<host>:<port>`, for example, `http://127.0.0.1:10809`.
    - **Advanced Mode**: Set the HTTP, HTTPS, and SOCKS proxy addresses separately.
3. **PAC Mode Configuration**: You can choose "Disable", "Whitelist", or "Blacklist" mode.
    - **Subscription Mode**: Input the URL of the PAC file.
    - **Manual Mode**: Input the local PAC rules.
4. **Bypass Rule Settings**: If you need to set URLs that should not use the proxy, you can enable the "Bypass Enabled" switch and input the bypass rules.

### Plugin Token Settings
Some plugins will maintain their own network connections and do not use Obsidian's default session, so their traffic will not be proxied. Users can proxy the network traffic of these plugins by setting plugin tokens. Here are some examples of plugin tokens for popular Obsidian plugins:
| Repository | Plugin Token |
|---|---|
| [Obsidian-Surfing](https://github.com/PKM-er/Obsidian-Surfing) | `persist:surfing-vault-${appId}` |
| [media-extended](https://github.com/PKM-er/media-extended) | `persist:mx-player-${appId}` |

### Blacklist Rules
The bypass list is a comma-separated list of rules, and the rules are as follows:
- `[ URL_SCHEME "://" ] HOSTNAME_PATTERN [ ":" <port> ]`: Matches all hostnames that conform to the `HOSTNAME_PATTERN` pattern. For example: `foobar.com`, `*foobar.com`, `*.foobar.com`, `*foobar.com:99`, `https://x.*.y.com:99`.
- `"." HOSTNAME_SUFFIX_PATTERN [ ":" PORT ]`: Matches specific domain suffixes. For example: `.google.com`, `.com`, `http://.google.com`.
- `[ SCHEME "://" ] IP_LITERAL [ ":" PORT ]`: Matches URLs with IP address literals. For example: `127.0.1`, `[0:0::1]`, `[::1]`, `http://[::1]:99`.
- `IP_LITERAL "/" PREFIX_LENGTH_IN_BITS`: Matches any URL with an IP address literal that falls within the given range. The IP range is specified using CIDR notation. For example: `127.0.68.1.1/16`, `fefe:13::abc/33`.
- `<local>`: Matches local addresses. The meaning of `<local>` is whether the host matches one of the following: `127.0.0.1`, `::1`, `localhost`.

### Proxy Connection Testing
In the plugin settings, input a test URL (for example, `https://www.google.com`), and then click the "Test Now" button. The plugin will try to access the URL through the proxy and display the test result.

## Language Switching
In the plugin settings, select the "Language" option to switch the language of the plugin interface. It supports English and Chinese.

## Precautions
- If all proxy addresses are invalid, all requests will be made directly without using a proxy.
- Some plugins may not support proxies, and this needs to be solved by setting plugin tokens. 