const posts = [
    {
        groupId: 123,
        nickname: 'JohnDoe',
        title: 'My First Post',
        content: 'This is the content of the post.',
        postPassword: '1234',
        groupPassword: 'abcd',
        imageUrl: 'http://example.com/image.png',
        tags: ['tag1', 'tag2'],
        location: 'Seoul',
        moment: new Date('2024-02-21'),
        isPublic: true,
        likeCount: 0,
        commentCount: 0,
    },
    {
        groupId: 123,
        nickname: 'JaneDoe',
        title: 'Another Post',
        content: 'Here is some different content.',
        postPassword: '5678',
        groupPassword: 'abcd',
        imageUrl: 'http://example.com/image2.png',
        tags: ['tag3'],
        location: 'Busan',
        moment: new Date('2024-03-01'),
        isPublic: true,
        likeCount: 2,
        commentCount: 5,
    }
];

export default posts;
