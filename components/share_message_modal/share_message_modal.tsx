// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable react/no-string-refs */

import React from 'react';
import {Modal} from 'react-bootstrap';
import {FormattedMessage} from 'react-intl';
import Input from 'components/input';

import {getEmbedFromMetadata} from 'mattermost-redux/utils/post_utils';

import {Channel} from 'mattermost-redux/types/channels';
import {ActionResult} from 'mattermost-redux/types/actions';

import FormattedMarkdownMessage from 'components/formatted_markdown_message';
import {browserHistory} from 'utils/browser_history';
import Constants from 'utils/constants';
import * as Utils from 'utils/utils.jsx';
import * as UserAgent from 'utils/user_agent';
import SuggestionBox from 'components/suggestion/suggestion_box';
import SuggestionBoxComponent from 'components/suggestion/suggestion_box/suggestion_box';
import SuggestionList from 'components/suggestion/suggestion_list.jsx';
import SwitchChannelProvider from 'components/suggestion/switch_channel_provider.jsx';
import NoResultsIndicator from 'components/no_results_indicator/no_results_indicator';

import {NoResultsVariant} from 'components/no_results_indicator/types';
import PostMessagePreview from 'components/post_view/post_message_preview';
import { Post, PostPreviewMetadata } from 'mattermost-redux/types/posts';
import GenericModal from 'components/generic_modal';
import QuickInput from 'components/quick_input/'

const CHANNEL_MODE = 'channel';

type ProviderSuggestions = {
    matchedPretext: any;
    terms: string[];
    items: any[];
    component: React.ReactNode;
}

export type Props = {

    /**
     * The function called to immediately hide the modal
     */
    onExited: () => void;

    post: Post,

    actions: {
        joinChannelById: (channelId: string) => Promise<ActionResult>;
        switchToChannel: (channel: Channel) => Promise<ActionResult>;
    };
}

type State = {
    text: string;
    mode: string|null;
    hasSuggestions: boolean;
    shouldShowLoadingSpinner: boolean;
    pretext: string;
    comment: string | undefined;
}

export default class ShareMessageModal extends React.PureComponent<Props, State> {
    private channelProviders: SwitchChannelProvider[];
    private switchBox: SuggestionBoxComponent|null;

    constructor(props: Props) {
        super(props);

        this.channelProviders = [new SwitchChannelProvider()];

        this.switchBox = null;

        this.state = {
            text: '',
            mode: CHANNEL_MODE,
            hasSuggestions: true,
            shouldShowLoadingSpinner: true,
            pretext: '',
            comment: '',
        };
    }

    private focusTextbox = (): void => {
        if (this.switchBox === null) {
            return;
        }

        const textbox = this.switchBox.getTextbox();
        if (document.activeElement !== textbox) {
            textbox.focus();
            Utils.placeCaretAtEnd(textbox);
        }
    };

    private setSwitchBoxRef = (input: SuggestionBoxComponent): void => {
        this.switchBox = input;
        this.focusTextbox();
    };

    private onHide = (): void => {
        this.focusPostTextbox();
        this.setState({
            text: '',
        });
        this.props.onExited();
    };

    private focusPostTextbox = (): void => {
        if (!UserAgent.isMobile()) {
            setTimeout(() => {
                const textbox = document.querySelector('#post_textbox') as HTMLElement;
                if (textbox) {
                    textbox.focus();
                }
            });
        }
    };

    getEmbed = () => {
        const {metadata} = this.props.post;
        return getEmbedFromMetadata(metadata);
    }

    private onChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        this.setState({text: e.target.value, shouldShowLoadingSpinner: true});
    };

    handleSelected = (selected) => {
        //TODO
    }

    handleCancel = () => {

    }

    public handleSubmit = async (selected?: any): Promise<void> => {
        if (!selected) {
            return;
        }

        if (this.state.mode === CHANNEL_MODE) {
            const {joinChannelById, switchToChannel} = this.props.actions;
            const selectedChannel = selected.channel;

            if (selected.type === Constants.MENTION_MORE_CHANNELS && selectedChannel.type === Constants.OPEN_CHANNEL) {
                await joinChannelById(selectedChannel.id);
            }
            switchToChannel(selectedChannel).then((result: ActionResult) => {
                if ('data' in result) {
                    this.onHide();
                }
            });
        } else {
            browserHistory.push('/' + selected.name);
            this.onHide();
        }
    };

    private handleSuggestionsReceived = (suggestions: ProviderSuggestions): void => {
        const loadingPropPresent = suggestions.items.some((item: any) => item.loading);
        this.setState({
            shouldShowLoadingSpinner: loadingPropPresent,
            pretext: suggestions.matchedPretext,
            hasSuggestions: suggestions.items.length > 0,
        });
    }

    public render = (): JSX.Element => {
        const providers: SwitchChannelProvider[] = this.channelProviders;

        const title = (
            <h1>
                <FormattedMessage
                    id='share_message_modal.shareMessage'
                    defaultMessage='Share Message'
                />
            </h1>
        );

        console.log("rendering")

        const embed = this.getEmbed();

        const data = embed.data;
        // let help;
        // if (Utils.isMobile()) {
        //     help = (
        //         <FormattedMarkdownMessage
        //             id='quick_switch_modal.help_mobile'
        //             defaultMessage='Type to find a channel.'
        //         />
        //     );
        // } else {
        //     help = (
        //         <FormattedMarkdownMessage
        //             id='quick_switch_modal.help_no_team'
        //             defaultMessage='Type to find a channel. Use **UP/DOWN** to browse, **ENTER** to select, **ESC** to dismiss.'
        //         />
        //     );
        // }

        return (
            <Modal
                dialogClassName='a11y__modal share-message-modal'
                ref='modal'
                show={true}
                onHide={this.onHide}
                enforceFocus={false}
                restoreFocus={false}
                role='dialog'
                aria-labelledby='ShareMessageModalLabel'
                animation={false}
            >
                <Modal.Header
                    id='ShareMessageModalLabel'
                    closeButton={true}
                />
                <Modal.Body>
                    <div className='share-message__header'>
                        {title}
                    </div>
                    <div className='share-message-modal__suggestion-box'>
                        <SuggestionBox // May need to make a different component entirely using parts of SuggestionBox, Input, and a proper dropdown.
                            placeholder={Utils.localizeMessage('share_message_share_input', 'Select channel or people')}
                            id='ShareMessageInput'
                            aria-label={Utils.localizeMessage('share_message_share.input', 'Share input')}
                            ref={this.setSwitchBoxRef}
                            className='form-control focused'
                            onChange={this.onChange}
                            value={this.state.text}
                            listComponent={SuggestionList}
                            listPosition='bottom'
                            maxLength='64'
                            providers={providers}
                            completeOnTab={false}
                            spellCheck='false'
                            delayInputUpdate={true}
                            openOnFocus={true}
                            openWhenEmpty={true}
                            onSuggestionsReceived={this.handleSuggestionsReceived}
                            renderDividers={true}
                            renderNoResults={true}
                            replaceAllInputOnSelect={true}
                            onItemSelected={this.handleSelected}
                            // forceSuggestionWhenBlue={true}
                        />
                        {/* <i className='icon icon-chevron-down icon-16'/> */}
                    </div>
                    <Input
                        name='Add a comment (optional)'
                        aria-label='Comment'
                        type='text'
                        value={this.state.comment}
                        onChange={(e) => {
                            this.setState({comment: e.target.value});
                        }}
                        placeholder={Utils.localizeMessage('share_message_comment_input', 'Add a comment (optional)')}
                        // error={this.state.inputErrorText}
                    />
                    <PostMessagePreview
                        metadata={data}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <button
                        id='shareMessageModalCancelButton'
                        type='button'
                        className='btn btn-link'
                        onClick={this.onHide}
                    >
                        <FormattedMessage
                            id='share_message.close'
                            defaultMessage='Cancel'
                        />
                    </button>
                    <button
                        id='shareMessageModalConfirm'
                        type='button'
                        className='btn btn-primary'
                        onClick={this.handleSubmit}
                    >
                        <FormattedMessage
                            id='share_message.confirm'
                            defaultMessage='Share'
                        />
                    </button>
                </Modal.Footer>
            </Modal>
        );
    }
}
/* eslint-enable react/no-string-refs */