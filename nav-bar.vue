<script lang="tsx">
import localforge from 'localforage';
import { LiveTab } from '@/enums/tab';
import { useLoginStore, useAnchorStore, AnchorMomentList } from '@/store';
import { DynamicStatus } from '@/enums/anchor';
import LiveSvg from '@/assets/lottie/live-with-bg.json';
import { some, filter } from 'lodash-es';
import MomentIcon from '@/assets/new-svg/live/moment.svg';

interface NavItem {
  id: LiveTab;
  title: string;
  icon?: any;
}

export default {
  emits: ['clickTab'],
  setup() {
    const useLogin = useLoginStore();
    const useAnchor = useAnchorStore();
    const isLogin = computed(() => useLogin.isLogin);
    const router = useRouter();
    const route = useRoute();
    const navState = reactive({
      navItems: [
        {
          id: LiveTab.ANCHOR,
          title: 'streamer_top',
          icon: computed(() => (some(useAnchor.anchorState.anchorList, ['liveStatus', 1]) ? LiveSvg : undefined))
        },
        {
          id: LiveTab.MATCH,
          title: 'mtc_live'
        }
      ]
    });

    const activeTabId = computed(() => useAnchor.anchorState.liveTopTab);

    watch(
      () => useLogin.isLogin,
      async (val: boolean) => {
        await useAnchor.getAnchorPersonalList();
        if (!val) {
          await useAnchor.getAnchorList({ matchSource: 'all' });
        }
      }
    );

    const goToMyFollows = () => {
      if (isLogin.value) {
        router.push('/my-follows');
      } else {
        router.push({ path: '/login', query: { backPath: route.fullPath } });
      }
    };

    const goToMomentAll = () => {
      useAnchor.changeLiveTopTab(1);
      router.push('/live/moment-all');
    };

    const onClickTab = (id: number) => {
      useAnchor.changeLiveTopTab(id);
      if (route.path !== '/live') {
        router.push('/live');
      }
    };

    const isShowNewMoment = ref(false);
    const new24hMomentList = computed(() => {
      return filter(useAnchor.anchorState.anchorPersonalList, o => o.dynamicStatus === DynamicStatus.HAS_DYNAMIC);
    });

    const newMomentKey = 'read_moment';
    const compareValue = async () => {
      const newList = (await useAnchor.getAllAnchorPostList({ size: 1, page: 1 })) as AnchorMomentList;
      const firstMoment = newList.list[0];
      if (route.path === '/live/moment-all') {
        localforge.setItem(newMomentKey, Number(new Date()));
        isShowNewMoment.value = false;
      } else {
        const momentStorageTime = await localforge.getItem(newMomentKey);
        isShowNewMoment.value = Number(momentStorageTime) < Number(firstMoment.createDate);
      }
    };

    watch(
      () => new24hMomentList.value,
      () => {
        compareValue();
      }
    );

    return {
      navState,
      activeTabId,
      onClickTab,
      goToMyFollows,
      goToMomentAll,
      isShowNewMoment
    };
  },
  render() {
    const renderMomentAllBtn = () => {
      return (
        <div class="moment-all-btn cursor-pointer" onClick={this.goToMomentAll}>
          <img src={MomentIcon} alt="click to moment all" />
          <p>{this.$t('streamer_home_stt_val_sub')}</p>
          {this.isShowNewMoment ? <span class="new-moment"></span> : null}
        </div>
      );
    };

    return (
      <div class="live-nav">
        <div class="live-nav__left cursor-pointer">
          {this.navState.navItems.map((nav: NavItem) => (
            <p class={{ active: this.activeTabId === nav.id }} onClick={() => this.onClickTab(nav.id)}>
              <span>{this.$t(nav.title)}</span>
              {nav.icon && <lottie-web class="lottie-icon" animationData={nav.icon} />}
            </p>
          ))}
        </div>
        <div class="live-nav__right cursor-pointer">
          {renderMomentAllBtn()}
          <div class="follow-btn" onClick={this.goToMyFollows}>
            <svg-icon name="common-star" />
            <p class="my-follows">{this.$t('top_menu_flw')}</p>
          </div>
        </div>
      </div>
    );
  }
};
</script>

<style lang="less" scoped>
.live-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: @bg-pc;
  padding: 24px calc((100% - 1280px) / 2);
  top: 118px;
  z-index: 50;
  width: 100%;

  .moment-all-btn {
    position: relative;
    display: flex;
    padding: 8px 12px;
    align-items: center;
    gap: 4px;
    border-radius: 10px;
    border: 1px solid @brand-primary;
    background: @bg-primary;

    .new-moment {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: @font-highlight-1;
    }

    img {
      width: 24px;
      height: 24px;
    }

    p {
      color: @font-primary;
      font-size: 16px;
      font-style: normal;
      font-weight: 400;
      line-height: normal;
    }
  }

  &__right {
    display: flex;
    gap: 32px;
  }

  &__left {
    display: flex;
    justify-content: flex-start;
    background-color: #f2e8f8;
    border-radius: 8px;

    p {
      font-weight: 400;
      font-size: 18px;
      line-height: 40px;
      min-width: 118px;
      height: 40px;
      text-align: center;
      padding: 0 32px;
      display: block;
      position: relative;
      color: #1f1f1f;

      &.active {
        font-weight: 600;
        color: #ffffff;
        background-color: #653dfe;
        border-radius: 8px;
      }
      &:last-child {
        margin-right: 0px;
      }
    }
    .lottie-icon {
      width: 16px;
      height: 16px;
      position: absolute;
      top: -3px;
      right: 23px;
    }
  }
  .follow-btn {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    background-color: #f2e8f8;
    padding: 8px 12px;
    border-radius: 10px;
    .svg-icon {
      width: 24px;
      height: 24px;
      margin-right: 4px;
    }
    .my-follows {
      align-self: center;
      font-weight: 400;
      font-size: 16px;
      color: #1f1f1f;
    }
  }
}
</style>
