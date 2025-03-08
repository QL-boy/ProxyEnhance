var import_obsidian = require("obsidian");

const DEFAULT_SETTINGS = {
    enableProxy: false,
    proxyMode: "basic",
    pacMode: "disabled",
    pacFileUrl: "",
    localPacRules: [],
    basicProxy: "",
    httpProxy: "",
    httpsProxy: "",
    socksProxy: "",
    bypassEnabled: false,
    bypassRules: "<local>,127.*,10.*,172.16.*,172.17.*,172.18.*,172.19.*,172.20.*,172.21.*,172.22.*,172.23.*,172.24.*,172.25.*,172.26.*,172.27.*,172.28.*,172.29.*,172.30.*,172.31.*,192.168.*",
    pluginTokens: "persist:surfing-vault-${appId}",
    pluginTokenMode: "whitelist",
    language: "en"
};

class GlobalProxyPlugin extends import_obsidian.Plugin {
    async onload() {
        await this.loadSettings();
        this.addSettingTab(new GlobalProxySettingTab(this.app, this));
        this.enableProxy();
    }

    onunload() {
        this.disableProxy();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        this.sessionMap = {};
        this.enableProxy();
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async enableProxy() {
        if (!this.settings.enableProxy) return;

        let sessions = [];
        this.sessionMap.default = electron.remote.session.defaultSession;
        sessions.push(this.sessionMap.default);

        if (this.settings.pluginTokens) {
            let pluginTokens = this.settings.pluginTokens.split("\n");
            for (let token of pluginTokens) {
                if (!token.trim()) continue;
                token = token.replace("${appId}", this.app.appId);
                let session = await electron.remote.session.fromPartition(token);
                sessions.push(session);
                this.sessionMap[token] = session;
            }
        }

        let proxyConfig;
        if (this.settings.pacMode !== "disabled") {
            if (this.settings.pacMode === "localList") {
                proxyConfig = { pacScript: this.generateLocalPacScript() };
            } else {
                proxyConfig = { pacScript: this.settings.pacFileUrl };
            }
        } else if (this.settings.proxyMode === "basic") {
            let proxyRule = this.composeBasicProxyRule();
            proxyConfig = { proxyRules: proxyRule, proxyBypassRules: this.settings.bypassRules };
        } else {
            let proxyRules = this.composeAdvancedProxyRules();
            proxyConfig = { proxyRules, proxyBypassRules: this.settings.bypassRules };
        }

        for (let session of sessions) {
            await session.setProxy(proxyConfig);
        }

        new import_obsidian.Notice(this.getLocaleString("enable_proxy_notice"));
    }

    async disableProxy() {
        let sessions = Object.values(this.sessionMap);
        for (let session of sessions) {
            await session.setProxy({});
            await session.closeAllConnections();
        }
        new import_obsidian.Notice(this.getLocaleString("disable_proxy_notice"));
    }

    composeBasicProxyRule() {
        const isValidFormat = (proxyUrl) => {
            if (proxyUrl) {
                const regex = /^(\w+):\/\/([^:/]+):(\d+)$/;
                return regex.test(proxyUrl);
            }
            return false;
        };

        return isValidFormat(this.settings.basicProxy) ? `${this.settings.basicProxy}` : "";
    }

    composeAdvancedProxyRules() {
        const isValidFormat = (proxyUrl) => {
            if (proxyUrl) {
                const regex = /^(\w+):\/\/([^:/]+):(\d+)$/;
                return regex.test(proxyUrl);
            }
            return false;
        };

        const httpProxy = isValidFormat(this.settings.httpProxy) ? `http=${this.settings.httpProxy}` : "";
        const httpsProxy = isValidFormat(this.settings.httpsProxy) ? `https=${this.settings.httpsProxy}` : "";
        const socksProxy = isValidFormat(this.settings.socksProxy) ? `${this.settings.socksProxy}` : "";

        let rules = [];
        if (httpProxy) rules.push(httpProxy);
        if (httpsProxy) rules.push(httpsProxy);
        if (socksProxy) rules.push(socksProxy);

        return rules.join(",") + ",direct://";
    }

    generateLocalPacScript() {
        const rules = this.settings.localPacRules.map(rule => `DIRECT;`).join("");
        return `
            function FindProxyForURL(url, host) {
                ${rules}
                return "DIRECT";
            }
        `;
    }

    getLocaleString(key) {
        const locales = {
            en: {
                enable_proxy_notice: "Enable proxy!",
                disable_proxy_notice: "Disable proxy!"
            },
            zh: {
                enable_proxy_notice: "启用代理！",
                disable_proxy_notice: "禁用代理！"
            }
        };
        return locales[this.settings.language][key] || key;
    }
}

class GlobalProxySettingTab extends import_obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        new import_obsidian.Setting(containerEl)
            .setName(this.getLocaleString("enable_proxy"))
            .setDesc(this.getLocaleString("change_proxy_status"))
            .addToggle(toggle =>
                toggle.setValue(this.plugin.settings.enableProxy)
                    .onChange(async value => {
                        this.plugin.settings.enableProxy = value;
                        await this.plugin.saveSettings();
                        value ? this.plugin.enableProxy() : this.plugin.disableProxy();
                    })
            );

        new import_obsidian.Setting(containerEl)
            .setName(this.getLocaleString("proxy_mode"))
            .setDesc(this.getLocaleString("choose_proxy_mode"))
            .addDropdown(dropdown =>
                dropdown.addOption("basic", this.getLocaleString("basic_mode"))
                    .addOption("advanced", this.getLocaleString("advanced_mode"))
                    .setValue(this.plugin.settings.proxyMode)
                    .onChange(async value => {
                        this.plugin.settings.proxyMode = value;
                        await this.plugin.saveSettings();
                        this.display();
                    })
            );

        if (this.plugin.settings.proxyMode === "basic") {
            new import_obsidian.Setting(containerEl)
                .setName(this.getLocaleString("basic_proxy"))
                .setDesc(this.getLocaleString("set_up_basic_proxy"))
                .addText(text =>
                    text.setPlaceholder("<scheme>://<host>:<port>")
                        .setValue(this.plugin.settings.basicProxy)
                        .onChange(async value => {
                            this.plugin.settings.basicProxy = value;
                            await this.plugin.saveSettings();
                            this.plugin.enableProxy();
                        })
                );
        } else {
            new import_obsidian.Setting(containerEl)
                .setName(this.getLocaleString("http_proxy"))
                .setDesc(this.getLocaleString("set_up_http_proxy"))
                .addText(text =>
                    text.setPlaceholder("<scheme>://<host>:<port>")
                        .setValue(this.plugin.settings.httpProxy)
                        .onChange(async value => {
                            this.plugin.settings.httpProxy = value;
                            await this.plugin.saveSettings();
                            this.plugin.enableProxy();
                        })
                );

            new import_obsidian.Setting(containerEl)
                .setName(this.getLocaleString("https_proxy"))
                .setDesc(this.getLocaleString("set_up_https_proxy"))
                .addText(text =>
                    text.setPlaceholder("<scheme>://<host>:<port>")
                        .setValue(this.plugin.settings.httpsProxy)
                        .onChange(async value => {
                            this.plugin.settings.httpsProxy = value;
                            await this.plugin.saveSettings();
                            this.plugin.enableProxy();
                        })
                );

            new import_obsidian.Setting(containerEl)
                .setName(this.getLocaleString("socks_proxy"))
                .setDesc(this.getLocaleString("set_up_socks_proxy"))
                .addText(text =>
                    text.setPlaceholder("<scheme>://<host>:<port>")
                        .setValue(this.plugin.settings.socksProxy)
                        .onChange(async value => {
                            this.plugin.settings.socksProxy = value;
                            await this.plugin.saveSettings();
                            this.plugin.enableProxy();
                        })
                );
        }

        new import_obsidian.Setting(containerEl)
            .setName(this.getLocaleString("pac_mode"))
            .setDesc(this.getLocaleString("choose_pac_mode"))
            .addDropdown(dropdown =>
                dropdown.addOption("disabled", this.getLocaleString("disabled"))
                    .addOption("whitelist", this.getLocaleString("whitelist"))
                    .addOption("blacklist", this.getLocaleString("blacklist"))
                    .setValue(this.plugin.settings.pacMode)
                    .onChange(async value => {
                        this.plugin.settings.pacMode = value;
                        await this.plugin.saveSettings();
                        this.display();
                    })
            );

        if (this.plugin.settings.pacMode !== "disabled") {
            new import_obsidian.Setting(containerEl)
                .setName(this.getLocaleString("pac_list_mode"))
                .setDesc(this.getLocaleString("choose_pac_list_mode"))
                .addDropdown(dropdown =>
                    dropdown.addOption("subscription", this.getLocaleString("subscription"))
                        .addOption("manual", this.getLocaleString("manual"))
                        .setValue(this.plugin.settings.pacFileUrl.startsWith("http") ? "subscription" : "manual")
                        .onChange(async value => {
                            if (value === "subscription") {
                                this.plugin.settings.pacFileUrl = prompt(this.getLocaleString("enter_pac_file_url"), this.plugin.settings.pacFileUrl);
                            } else {
                                this.plugin.settings.localPacRules = prompt(this.getLocaleString("enter_local_pac_rules"), this.plugin.settings.localPacRules.join("\n")).split("\n").filter(line => line.trim().length > 0);
                            }
                            await this.plugin.saveSettings();
                            this.plugin.enableProxy();
                            this.display();
                        })
                );

            if (this.plugin.settings.pacMode === "whitelist" || this.plugin.settings.pacMode === "blacklist") {
                new import_obsidian.Setting(containerEl)
                    .setName(this.getLocaleString("pac_rules"))
                    .setDesc(this.getLocaleString("enter_pac_rules"))
                    .addTextArea(textArea =>
                        textArea.setValue(this.plugin.settings.pacMode === "whitelist" ? this.plugin.settings.pacFileUrl : this.plugin.settings.localPacRules.join("\n"))
                            .onChange(async value => {
                                if (this.plugin.settings.pacMode === "whitelist") {
                                    this.plugin.settings.pacFileUrl = value;
                                } else {
                                    this.plugin.settings.localPacRules = value.split("\n").filter(line => line.trim().length > 0);
                                }
                                await this.plugin.saveSettings();
                                this.plugin.enableProxy();
                            })
                    );
            }
        }

        new import_obsidian.Setting(containerEl)
            .setName(this.getLocaleString("bypass_enabled"))
            .setDesc(this.getLocaleString("toggle_bypass"))
            .addToggle(toggle =>
                toggle.setValue(this.plugin.settings.bypassEnabled)
                    .onChange(async value => {
                        this.plugin.settings.bypassEnabled = value;
                        await this.plugin.saveSettings();
                        this.display();
                    })
            );

        if (this.plugin.settings.bypassEnabled) {
            new import_obsidian.Setting(containerEl)
                .setName(this.getLocaleString("bypass_rules"))
                .setDesc(this.getLocaleString("enter_bypass_rules"))
                .addTextArea(textArea =>
                    textArea.setPlaceholder("[URL_SCHEME://] HOSTNAME_PATTERN [:<port>]\n. HOSTNAME_SUFFIX_PATTERN [:PORT]\n[SCHEME://] IP_LITERAL [:PORT]\nIP_LITERAL / PREFIX_LENGTH_IN_BITS\n<local>")
                        .setValue(this.plugin.settings.bypassRules)
                        .onChange(async value => {
                            this.plugin.settings.bypassRules = value;
                            await this.plugin.saveSettings();
                            this.plugin.enableProxy();
                        })
                );
        }

        new import_obsidian.Setting(containerEl)
            .setName(this.getLocaleString("plugin_token_mode"))
            .setDesc(this.getLocaleString("choose_plugin_token_mode"))
            .addDropdown(dropdown =>
                dropdown.addOption("global", this.getLocaleString("global"))
                    .addOption("whitelist", this.getLocaleString("whitelist"))
                    .addOption("blacklist", this.getLocaleString("blacklist"))
                    .setValue(this.plugin.settings.pluginTokenMode)
                    .onChange(async value => {
                        this.plugin.settings.pluginTokenMode = value;
                        await this.plugin.saveSettings();
                        this.display();
                    })
            );

        if (this.plugin.settings.pluginTokenMode !== "global") {
            new import_obsidian.Setting(containerEl)
                .setName(this.getLocaleString("plugin_tokens"))
                .setDesc(this.getLocaleString("for_proxy_specified_plugins"))
                .addTextArea(textArea =>
                    textArea.setValue(this.plugin.settings.pluginTokens)
                        .onChange(async value => {
                            this.plugin.settings.pluginTokens = value;
                            await this.plugin.saveSettings();
                            this.plugin.enableProxy();
                        })
                );
        }

        new import_obsidian.Setting(containerEl)
            .setName(this.getLocaleString("language"))
            .setDesc(this.getLocaleString("select_language"))
            .addDropdown(dropdown =>
                dropdown.addOption("en", this.getLocaleString("english"))
                    .addOption("zh", this.getLocaleString("chinese"))
                    .setValue(this.plugin.settings.language)
                    .onChange(async value => {
                        this.plugin.settings.language = value;
                        await this.plugin.saveSettings();
                        this.display();
                    })
            );

        new import_obsidian.Setting(containerEl)
            .setName(this.getLocaleString("test_proxy_connection"))
            .setDesc(this.getLocaleString("test_your_proxy_connection"))
            .addText(text =>
                text.setPlaceholder("https://www.google.com")
                    .setValue("")
                    .onChange(value => {
                        this.testUrl = value;
                    })
            )
            .addButton(button =>
                button.setButtonText(this.getLocaleString("test_now"))
                    .onClick(() => this.testProxyConnection())
            );
    }

    testProxyConnection() {
        fetch(this.testUrl || "https://www.google.com", { mode: 'no-cors' })
            .then(response => {
                new import_obsidian.Notice(this.getLocaleString("proxy_test_success"));
            })
            .catch(error => {
                new import_obsidian.Notice(this.getLocaleString("proxy_test_failed"), 5000);
                console.error("Error during proxy test:", error);
            });
    }

    getLocaleString(key) {
        const locales = {
            en: {
                enable_proxy: "Enable Proxy",
                change_proxy_status: "Change your proxy status",
                proxy_mode: "Proxy Mode",
                choose_proxy_mode: "Choose between basic or advanced configuration",
                basic_mode: "Basic Mode",
                advanced_mode: "Advanced Mode",
                basic_proxy: "Basic Proxy",
                set_up_basic_proxy: "Set up your basic proxy",
                auto_detect_proxy_type: "Auto Detect Proxy Type",
                automatically_detect_proxy_type: "Automatically detect proxy type based on input",
                http_proxy: "HTTP Proxy",
                set_up_http_proxy: "Set up your HTTP proxy",
                https_proxy: "HTTPS Proxy",
                set_up_https_proxy: "Set up your HTTPS proxy",
                socks_proxy: "SOCKS Proxy",
                set_up_socks_proxy: "Set up your SOCKS proxy",
                plugin_tokens: "Plugin Tokens",
                for_proxy_specified_plugins: "For proxy specified plugins",
                blacklist: "Blacklist",
                whitelist: "Whitelist",
                disabled: "Disabled",
                global: "Global",
                subscription: "Subscription",
                manual: "Manual",
                pac_mode: "PAC Mode",
                choose_pac_mode: "Choose PAC mode",
                pac_file_url: "PAC File URL",
                enter_pac_file_url: "Enter the URL of your PAC file",
                enter_local_pac_rules: "Enter your local PAC rules",
                pac_rules: "PAC Rules",
                enter_pac_rules: "Enter your PAC rules",
                pac_list_mode: "PAC List Mode",
                choose_pac_list_mode: "Choose PAC list mode",
                bypass_enabled: "Bypass Enabled",
                toggle_bypass: "Toggle Bypass Mode",
                bypass_rules: "Bypass Rules",
                enter_bypass_rules: "Enter your bypass rules",
                plugin_token_mode: "Plugin Token Mode",
                choose_plugin_token_mode: "Choose plugin token mode",
                language: "Language",
                select_language: "Select the language for the plugin UI",
                english: "English",
                chinese: "Chinese",
                test_proxy_connection: "Test Proxy Connection",
                test_your_proxy_connection: "Test your proxy connection by clicking the button below",
                test_now: "Test Now",
                enable_proxy_notice: "Enable proxy!",
                disable_proxy_notice: "Disable proxy!",
                proxy_test_success: "Proxy test successful!",
                proxy_test_failed: "Proxy test failed! Check your settings."
            },
            zh: {
                enable_proxy: "启用代理",
                change_proxy_status: "更改您的代理状态",
                proxy_mode: "代理模式",
                choose_proxy_mode: "选择基础或高级配置",
                basic_mode: "基础模式",
                advanced_mode: "高级模式",
                basic_proxy: "基础代理",
                set_up_basic_proxy: "设置您的基础代理",
                auto_detect_proxy_type: "自动检测代理类型",
                automatically_detect_proxy_type: "根据输入自动检测代理类型",
                http_proxy: "HTTP 代理",
                set_up_http_proxy: "设置您的 HTTP 代理",
                https_proxy: "HTTPS 代理",
                set_up_https_proxy: "设置您的 HTTPS 代理",
                socks_proxy: "SOCKS 代理",
                set_up_socks_proxy: "设置您的 SOCKS 代理",
                plugin_tokens: "插件令牌",
                for_proxy_specified_plugins: "为指定插件设置代理",
                blacklist: "黑名单",
                whitelist: "白名单",
                disabled: "禁用",
                global: "全局",
                subscription: "订阅",
                manual: "手动",
                pac_mode: "PAC 模式",
                choose_pac_mode: "选择 PAC 模式",
                pac_file_url: "PAC 文件 URL",
                enter_pac_file_url: "输入您的 PAC 文件 URL",
                enter_local_pac_rules: "输入您的本地 PAC 规则",
                pac_rules: "PAC 规则",
                enter_pac_rules: "输入您的 PAC 规则",
                pac_list_mode: "PAC 列表模式",
                choose_pac_list_mode: "选择 PAC 列表模式",
                bypass_enabled: "绕过已启用",
                toggle_bypass: "切换绕过模式",
                bypass_rules: "绕过规则",
                enter_bypass_rules: "输入您的绕过规则",
                plugin_token_mode: "插件令牌模式",
                choose_plugin_token_mode: "选择插件令牌模式",
                language: "语言",
                select_language: "选择插件界面的语言",
                english: "英语",
                chinese: "中文",
                test_proxy_connection: "测试代理连接",
                test_your_proxy_connection: "点击下方按钮测试您的代理连接",
                test_now: "立即测试",
                enable_proxy_notice: "启用代理！",
                disable_proxy_notice: "禁用代理！",
                proxy_test_success: "代理测试成功！",
                proxy_test_failed: "代理测试失败！请检查设置。"
            }
        };
        return locales[this.plugin.settings.language][key] || key;
    }
}

module.exports = GlobalProxyPlugin;



