import { Image, Container, Title, Text, Button, SimpleGrid } from '@mantine/core';
import classes from './NotFoundImage.module.css';
import { MainDashboard } from '../Dashboard/dashboard';

export function NotFound() {
  return (
    <MainDashboard classNames={{
      wrapper: "-mt-4",
      inner: "*:shadow-none",
    }}>
      <Container className={classes.root}>
        <SimpleGrid spacing={{ base: 40, sm: 80 }} cols={{ base: 1, sm: 2 }}>
          <Image src={'/img/not-found.svg'} className={classes.mobileImage} width={400} height={300} alt="page has not been found" />
          <div>
            <Title className={classes.title}>Something is not right...</Title>
            <Text c="dimmed" size="lg">
              Page you are trying to open does not exist. You may have mistyped the address, or the
              page has been moved to another URL. If you think this is an error contact support.
            </Text>
            <Button component='a' href={window?.origin} variant="outline" size="md" mt="xl" className={classes.control}>
              Get back to home page
            </Button>
          </div>
          <Image src={'/img/not-found.svg'} className={classes.desktopImage} width={400} height={300} alt="page has not been found" />
        </SimpleGrid>
      </Container>
    </MainDashboard>
  );
}