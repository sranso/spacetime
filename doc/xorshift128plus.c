/*  Written in 2014-2015 by Sebastiano Vigna (vigna@acm.org)

To the extent possible under law, the author has dedicated all copyright
and related and neighboring rights to this software to the public domain
worldwide. This software is distributed without any warranty.

See <http://creativecommons.org/publicdomain/zero/1.0/>. */

#include <stdint.h>
#include <stdio.h>
#include <inttypes.h>

/* This is the fastest generator passing BigCrush without
   systematic failures, but due to the relatively short period it is
   acceptable only for applications with a mild amount of parallelism;
   otherwise, use a xorshift1024* generator.

   The state must be seeded so that it is not everywhere zero. If you have
   a 64-bit seed, we suggest to seed a splitmix64 generator and use its
   output to fill s. */

uint64_t s[2];

uint64_t next(void) {
    uint64_t s1 = s[0];
    const uint64_t s0 = s[1];
    s[0] = s0;
    s1 ^= s1 << 23; // a
    s[1] = s1 ^ s0 ^ (s1 >> 18) ^ (s0 >> 5); // b, c
    return s[1] + s0;
}

/* This is a fixed-increment version of Java 8's SplittableRandom generator
   See http://dx.doi.org/10.1145/2714064.2660195 and 
   http://docs.oracle.com/javase/8/docs/api/java/util/SplittableRandom.html

   It is a very fast generator passing BigCrush, and it can be useful if
   for some reason you absolutely want 64 bits of state; otherwise, we
   rather suggest to use a xorshift128+ (for moderately parallel
   computations) or xorshift1024* (for massively parallel computations)
   generator. */

uint64_t splitmix_x; /* The state can be seeded with any value. */

uint64_t splitmix64_next() {
    uint64_t z = (splitmix_x += UINT64_C(0x9E3779B97F4A7C15));
    z = (z ^ (z >> 30)) * UINT64_C(0xBF58476D1CE4E5B9);
    z = (z ^ (z >> 27)) * UINT64_C(0x94D049BB133111EB);
    return z ^ (z >> 31);
}

int main(int argc, char *argv[])
{
    splitmix_x = UINT64_C(12345678901234567890);
    printf("seeding splitmix with (decimal) %" PRIu64 "\n", splitmix_x);

    s[0] = splitmix64_next();
    s[1] = splitmix64_next();
    printf("seeding xorshift128+ with %" PRIx64 " and %" PRIx64 "\n", s[0], s[1]);

    printf("1: %" PRIx64 "\n", next());
    printf("2: %" PRIx64 "\n", next());
    printf("3: %" PRIx64 "\n", next());
    printf("4: %" PRIx64 "\n", next());
    printf("5: %" PRIx64 "\n", next());

    return 0;
}
