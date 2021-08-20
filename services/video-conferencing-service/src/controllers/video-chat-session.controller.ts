import {service} from '@loopback/core';
import {
  get,
  getModelSchemaRef, param,
  patch,
  post,
  requestBody
} from '@loopback/rest';
import {
  CONTENT_TYPE,
  OPERATION_SECURITY_SPEC, STATUS_CODE
} from '@sourceloop/core';
import {authenticate, STRATEGY} from 'loopback4-authentication';
import {authorize} from 'loopback4-authorization';
import {PermissionKeys} from '../enums/permission-keys.enum';
import {SessionAttendees, VideoChatSession} from '../models';
import {VonageSessionWebhookPayload} from '../providers/vonage';
import {ChatSessionService} from '../services/chatSession.service';
import {
  MeetingOptions,
  SessionOptions, SessionResponse
} from '../types';
export class VideoChatSessionController {
  constructor(
 @service(ChatSessionService) public chatSessionService: ChatSessionService
  ) {}

  @authenticate(STRATEGY.BEARER)
  @authorize({permissions: [PermissionKeys.CreateSession]})
  @post('/session', {
    description: `Used for Creating a session with options such as end to end encryption, archive mode.
      Note: Archiving Option cannot be enabled while using end to end encryption, otherwise
      an Error will be thrown. Successful execution will send a meeting link
      id which can be used to amend in client url.`,
    security: OPERATION_SECURITY_SPEC,
    responses: {
      [STATUS_CODE.OK]: {
        content: {
          [CONTENT_TYPE.TEXT]: {schema: {type: 'string'}},
        },
      },
    },
  })
  async getMeetingLink(
    @requestBody()
    meetingOptions: MeetingOptions,
  ): Promise<string> {
   return await this.chatSessionService.getMeetingLink(meetingOptions)
  }

  @authenticate(STRATEGY.BEARER)
  @authorize({permissions: [PermissionKeys.GenerateToken]})
  @post('/session/{meetingLinkId}/token', {
    description: `Used for Generating token, which is used for connecting to a room/session on a client side.
      In vonage, there are three different roles (Moderator, Subscriber, Publisher).
      We can use expire time for limited validity of a token. Successful
      execution will send a token.`,
    security: OPERATION_SECURITY_SPEC,
    responses: {
      [STATUS_CODE.OK]: {
        content: {
          [CONTENT_TYPE.JSON]: {
            schema: {
              sessionId: 'string',
              token: 'string',
            },
          },
        },
      },
    },
  })
  async getMeetingToken(
    @requestBody()
    sessionOptions: SessionOptions,
    @param.path.string('meetingLinkId') meetingLinkId: string,
  ): Promise<SessionResponse> {
    return this.chatSessionService.getMeetingToken(sessionOptions, meetingLinkId);
  }

  @authenticate(STRATEGY.BEARER)
  @authorize({permissions: [PermissionKeys.EditMeeting]})
  @patch('/session/{meetingLinkId}', {
    description: 'Used for editing the meeting',
    security: OPERATION_SECURITY_SPEC,
    responses: {
      [STATUS_CODE.NO_CONTENT]: {
        description: 'Session details PATCH success',
      },
    },
  })
  async editMeeting(
    @param.path.string('meetingLinkId') meetingLinkId: string,
    @requestBody({
      content: {
        [CONTENT_TYPE.JSON]: {
          schema: getModelSchemaRef(VideoChatSession, {partial: true}),
        },
      },
    })
    body: Partial<VideoChatSession>,
  ): Promise<void> {

    return await this.chatSessionService.editMeeting(meetingLinkId, body);


  }

  @authenticate(STRATEGY.BEARER)
  @authorize({permissions: [PermissionKeys.StopMeeting]})
  @patch('/session/{meetingLinkId}/end', {
    description: `Used to stop the current active meeting. Meeting cannot be stopped again if it is
      already stopped. Successful execution will add the endTime attribute to a recently
      ending session.`,
    security: OPERATION_SECURITY_SPEC,
    responses: {
      [STATUS_CODE.NO_CONTENT]: {
        description: 'MessageRecipient PATCH success',
      },
    },
  })
  async endSession(
    @param.path.string('meetingLinkId') meetingLinkId: string,
  ): Promise<void> {
    return await this.chatSessionService.endSession(meetingLinkId);
  }

  @authorize({permissions: ['*']})
  @post('/webhooks/session', {
    description:
      'Webhook API hit from a third party to add/update session attendees in a meeting.',
    responses: {
      [STATUS_CODE.NO_CONTENT]: {
        description: 'POST /webhooks/session Success',
      },
    },
  })
  async checkWebhookPayload(
    @requestBody() webhookPayload: VonageSessionWebhookPayload,
  ) {
    return await this.chatSessionService.checkWebhookPayload(webhookPayload);
  }



  @authenticate(STRATEGY.BEARER)
  @authorize({permissions: [PermissionKeys.GetAttendees]})
  @get('/session/{meetingLinkId}/attendees', {
    security: OPERATION_SECURITY_SPEC,
    parameters: [{name: 'active', schema: {type: 'string'}, in: 'query'}],
    responses: {
      [STATUS_CODE.OK]: {
        content: {
          [CONTENT_TYPE.TEXT]: {schema: {type: 'array'}},
        },
      },
    },
  })
  async getAttendeesList(
    @param.path.string('meetingLinkId') meetingLinkId: string,
    @param.query.string('active') active: string,
  ): Promise<SessionAttendees[]> {

    return await this.chatSessionService.getAttendeesList(meetingLinkId,active);
  }


}
