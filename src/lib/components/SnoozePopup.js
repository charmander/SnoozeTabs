import React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import MainPanel from './MainPanel';
import ManagePanel from './ManagePanel';
import { makeLogger, getLangDir } from '../utils';

const log = makeLogger('FE <SnoozePopup>');
const langDir = getLangDir(browser.i18n.getUILanguage());

export default class SnoozePopup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activePanel: 'main',
      tabIsSnoozable: true,
      dontShow: false,
      entries: {}
    };
  }

  componentDidMount() {
    this.detectTabIsSnoozable();
    this.fetchEntries();

    this.storageHandler = (changes, area) => {
      // TODO: granularly apply the changes, rather than triggering a refresh?
      if (area === 'local') { this.fetchEntries(); }
    };
    browser.storage.onChanged.addListener(this.storageHandler);
  }

  componentWillUnmount() {
    browser.storage.onChanged.removeListener(this.storageHandler);
    window.removeEventListener('resize', this.boundHandleResize);
  }

  detectTabIsSnoozable() {
    const { activePanel } = this.state;
    this.props.queryTabIsSnoozable().then(tabIsSnoozable => {
      this.setState({
        tabIsSnoozable,
        activePanel: tabIsSnoozable ? activePanel : 'manage'
      });
    }).catch(reason => log('queryTabIsSnoozable got rejected', reason));
  }

  fetchEntries() {
    this.props.getAlarmsAndProperties().then(data => {
      const dontShow = !!data.dontShow;
      const entries = data.alarms;
      log('fetched entries', dontShow, entries);
      this.setState({ dontShow, entries });
    }).catch(reason => {
      log('fetchEntries storage get rejected', reason);
    });
  }

  switchPanel(name) {
    this.setState({ activePanel: name });
  }

  render() {
    const { activePanel, tabIsSnoozable } = this.state;
    const passProps = {
      ...this.props,
      ...this.state,
      switchPanel: this.switchPanel.bind(this)
    };
    if (!tabIsSnoozable) {
      return (
        <div dir={langDir} className="panel-wrapper">
          <ManagePanel {...passProps} id="manage" key="manage" active={'manage' === activePanel} />
        </div>
      );
    } else {
      return (
        <ReactCSSTransitionGroup component="div" dir={langDir} className="panel-wrapper" transitionName="panel" transitionEnterTimeout={250} transitionLeaveTimeout={250}>
          <MainPanel {...passProps} id="main" key="main" active={'main' === activePanel} />
          {('manage' === activePanel) && <ManagePanel {...passProps} id="manage" key="manage" active={'manage' === activePanel} />}
        </ReactCSSTransitionGroup>
      );
    }
  }
}

SnoozePopup.propTypes = {
  cancelSnoozedTab: React.PropTypes.func.isRequired,
  getAlarmsAndProperties: React.PropTypes.func.isRequired,
  moment: React.PropTypes.func.isRequired,
  openSnoozedTab: React.PropTypes.func.isRequired,
  queryTabIsSnoozable: React.PropTypes.func.isRequired,
  scheduleSnoozedTab: React.PropTypes.func.isRequired,
  undeleteSnoozedTab: React.PropTypes.func.isRequired,
  updateDontShow: React.PropTypes.func.isRequired,
  updateSnoozedTab: React.PropTypes.func.isRequired,
};
