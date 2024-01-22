// Copyright 2023-2024 Giacomo Ferretti
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import Gio from "gi://Gio";
import GObject from "gi://GObject";
import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as QuickSettings from "resource:///org/gnome/shell/ui/quickSettings.js";

const SCHEMA_ID = "org.gnome.desktop.interface";
const SCHEMA_KEY_TEXT_SCALING_FACTOR = "text-scaling-factor";
const ICON = "font-x-generic-symbolic";

const scaling = [1, 1.25, 1.5, 1.75, 2];

const ScalingFactorMenuToggle = GObject.registerClass(
  class ScalingFactorMenuToggle extends QuickSettings.QuickMenuToggle {
    _init() {
      super._init({
        title: _("Scaling Factor"),
        iconName: ICON,
      });

      this._profileItems = new Map();

      this._settings = new Gio.Settings({
        schema_id: SCHEMA_ID,
      });

      // Since this "toggle" menu isn't being used as a toggle button
      // clicking should just open the menu.
      this.connect("clicked", () => {
        this.menu.open();
      });

      // Dynamically add menu items to the menu
      scaling.forEach((factor) => {
        const factorString = factor.toFixed(2);

        // Create item
        const item = new PopupMenu.PopupMenuItem(factorString);
        item.connect("activate", () => {
          this._settings.set_double(SCHEMA_KEY_TEXT_SCALING_FACTOR, factor);
        });
        this.menu.addMenuItem(item);

        // Check current factor
        const currentFactor = this._settings.get_double(
          SCHEMA_KEY_TEXT_SCALING_FACTOR
        );
        item.setOrnament(
          factor === currentFactor
            ? PopupMenu.Ornament.CHECK
            : PopupMenu.Ornament.NONE
        );

        // Add to map
        this._profileItems.set(factor, item);
      });

      this._settings.connect(
        "changed::text-scaling-factor",
        (settings, key) => {
          const factor = settings.get_double(key);
          this._profileItems.forEach((item, key) => {
            item.setOrnament(
              key === factor
                ? PopupMenu.Ornament.CHECK
                : PopupMenu.Ornament.NONE
            );
          });
        }
      );
    }
  }
);

const ScalingFactorIndicator = GObject.registerClass(
  class ScalingFactorIndicator extends QuickSettings.SystemIndicator {
    constructor() {
      super();

      // Show indicator in the panel
      // this._indicator = this._addIndicator();
      // this._indicator.iconName = ICON;
      // this._indicator.visible = false;

      this._toggle = new ScalingFactorMenuToggle();

      // Make sure to destroy the toggle along with the indicator.
      this.connect("destroy", () => {
        this.quickSettingsItems.forEach((item) => item.destroy());
      });

      this.quickSettingsItems.push(this._toggle);
      // Add the indicator to the panel and the toggle to the menu.
      Main.panel.statusArea.quickSettings.addExternalIndicator(this);
    }
  }
);

export default class QuickSettingsExampleExtension extends Extension {
  enable() {
    this._indicator = new ScalingFactorIndicator();
  }

  disable() {
    this._indicator.destroy();
    this._indicator = null;
  }
}
