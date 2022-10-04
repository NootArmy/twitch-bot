import { RefreshingAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';
import { ApiClient, ChattersList } from '@twurple/api';
import { promises as fs } from 'fs';

import { clientId, clientSecret } from './credentials.js';

const tokensFile = './tokens.json';
const fileEncoding = 'UTF-8';
const trackedChannels = [
    'pudgyycat',
    'kingmcewan',
    'cajogos',
    'yeekaycrafts',
    'lifeofbeard',
    'mrricardo94'
];

async function main()
{
    const tokenData = JSON.parse(await fs.readFile(tokensFile, fileEncoding));

    const authProvider = new RefreshingAuthProvider({
        clientId,
        clientSecret,
        onRefresh: async newTokenData => await fs.writeFile(
            tokensFile,
            JSON.stringify(newTokenData, null, 4),
            fileEncoding
        )
    }, tokenData);

    const chatClient = new ChatClient({
        authProvider,
        channels: trackedChannels
    });

    const apiClient = new ApiClient({ authProvider });


    chatClient.onMessage(async (channel, username, text) =>
    {
        console.log(`[${channel}] ${username}: ${text}`);

        if (text === 'nootnoot')
        {
            chatClient.say(channel, 'NOOT NOOT!');

            const user = await apiClient.users.getUserByName(username);

            console.log('*** FOLLOWS ***');
            let follows = await apiClient.users.getFollows({ user: user.id });
            console.log(`${username} follows ${follows.total} channels`);
            for (const follow of follows.data)
            {
                console.log(follow.followedUserId, follow.followedUserDisplayName, follow.followedUserName, follow.followDate.toLocaleDateString());
            }

            console.log('*** FOLLOWERS ***');
            let followers = await apiClient.users.getFollows({ followedUser: user.id });
            console.log(`${username} has ${followers.total} followers`);
            for (const follower of followers.data)
            {
                console.log(follower.userId, follower.userDisplayName, follower.userName);
            }

            let channelUser = await apiClient.users.getUserByName(channel.replace('#', ''));
            let channelObject = await apiClient.channels.getChannelInfoById(channelUser.id);
            console.log(`${channelObject.displayName} is playing ${channelObject.gameName}.`);

            let chatters = await apiClient.unsupported.getChatters(channelObject.name);
            for (const chatter of chatters.allChattersWithStatus)
            {
                console.log(chatter);
            }
        }
    });



    await chatClient.connect();
}

main();